import { BaseAgent, AgentEvent, Severity } from "./base-agent";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vertex-autopilot.vercel.app";

export class InvoiceAgent extends BaseAgent {
  constructor() {
    super("invoice_manager");
  }

  async check(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const overdue = await this.checkOverdueInvoices();
    const priceAlerts = await this.detectPriceAnomalies();
    events.push(...overdue, ...priceAlerts);
    return events;
  }

  /** Flag invoices past due date */
  async checkOverdueInvoices(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const today = new Date().toISOString().split("T")[0];

    const { data: overdue } = await this.supabase
      .from("invoices")
      .select("*, vendors!inner(name)")
      .in("status", ["pending", "approved"])
      .lt("due_date", today);

    if (!overdue) return events;

    for (const inv of overdue) {
      const daysOverdue = Math.ceil(
        (Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const vendorName = (inv.vendors as { name: string }).name;

      // Check if we already flagged this today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "invoice_overdue")
        .eq("metadata->>invoice_id", inv.id)
        .gte("created_at", todayStart.toISOString())
        .single();

      if (existing) continue;

      const severity: Severity = daysOverdue > 60 ? "critical" : daysOverdue > 30 ? "warning" : "info";

      const event: AgentEvent = {
        agent_type: "invoice_manager",
        event_type: "invoice_overdue",
        location_id: inv.location_id,
        severity,
        description: `💰 Invoice #${inv.invoice_number} from ${vendorName} is ${daysOverdue} days overdue ($${inv.total})`,
        action_taken: daysOverdue > 60 ? "Critical overdue alert sent" : "Payment reminder sent",
        metadata: {
          invoice_id: inv.id,
          vendor_name: vendorName,
          days_overdue: daysOverdue,
          amount: inv.total,
        },
      };

      await this.logEvent(event);

      // Notify for overdue > 30 days
      if (daysOverdue > 30 && inv.location_id) {
        await this.notify(
          severity,
          { name: "Manager" },
          `💰 OVERDUE: Invoice #${inv.invoice_number} from ${vendorName} — $${inv.total} is ${daysOverdue} days past due.\n${BASE_URL}/dashboard/invoices/${inv.id}`,
          `Overdue Invoice — ${vendorName}`,
          `<div style="font-family:sans-serif;padding:20px;background:#111827;color:white;border-radius:12px;">
            <h2 style="color:#f87171;">💰 Overdue Invoice</h2>
            <p><strong>${vendorName}</strong> — Invoice #${inv.invoice_number}</p>
            <p>Amount: $${inv.total} | ${daysOverdue} days overdue</p>
            <a href="${BASE_URL}/dashboard/invoices/${inv.id}" style="color:#60a5fa;">View Invoice →</a>
          </div>`,
          undefined,
          inv.location_id
        );
      }

      events.push(event);
    }

    return events;
  }

  /** Detect >5% price increases from vendors */
  async detectPriceAnomalies(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get recent invoice items with price changes > 5%
    const { data: alerts } = await this.supabase
      .from("invoice_items")
      .select("*, invoices!inner(id, location_id, vendor_id, invoice_number, vendors!inner(name))")
      .gt("price_change_pct", 5)
      .order("price_change_pct", { ascending: false })
      .limit(50);

    if (!alerts) return events;

    for (const item of alerts) {
      const inv = item.invoices as { id: string; location_id: string; vendor_id: string; invoice_number: string; vendors: { name: string } };

      // Check if already flagged
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "price_increase")
        .eq("metadata->>invoice_item_id", item.id)
        .gte("created_at", weekAgo)
        .single();

      if (existing) continue;

      const event: AgentEvent = {
        agent_type: "invoice_manager",
        event_type: "price_increase",
        location_id: inv.location_id,
        severity: item.price_change_pct > 20 ? "warning" : "info",
        description: `📈 ${item.description} from ${inv.vendors.name}: +${item.price_change_pct}% ($${item.previous_price} → $${item.unit_price})`,
        action_taken: "Price alert flagged for review",
        metadata: {
          invoice_item_id: item.id,
          invoice_id: inv.id,
          vendor_name: inv.vendors.name,
          item: item.description,
          old_price: item.previous_price,
          new_price: item.unit_price,
          change_pct: item.price_change_pct,
        },
      };

      await this.logEvent(event);
      events.push(event);
    }

    return events;
  }

  /** OCR an invoice image using GPT-4o vision */
  async ocrInvoice(imageUrl: string): Promise<Record<string, unknown> | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY not set — OCR unavailable");
      return null;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract all data from this invoice image. Return valid JSON with this exact structure:
{
  "vendor_name": "string",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD or null",
  "items": [
    {
      "description": "string",
      "category": "produce|meat|dairy|beverages|supplies|cleaning|paper_goods|equipment|other",
      "quantity": number,
      "unit": "case|lb|each|gallon|bag|box|other",
      "unit_price": number,
      "total_price": number
    }
  ],
  "subtotal": number,
  "tax": number,
  "total": number
}
Only return the JSON, no markdown formatting.`,
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      // Parse the JSON (strip any markdown fencing)
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("OCR failed:", err);
      return null;
    }
  }

  /** Compare current price against history and record new price */
  async comparePriceAndRecord(
    vendorId: string,
    itemDescription: string,
    unitPrice: number,
    unit: string
  ): Promise<{ previousPrice: number | null; changePercent: number | null }> {
    // Get the most recent price for this item from this vendor
    const { data: history } = await this.supabase
      .from("vendor_price_history")
      .select("unit_price")
      .eq("vendor_id", vendorId)
      .ilike("item_description", itemDescription)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    const previousPrice = history?.unit_price ? Number(history.unit_price) : null;
    let changePercent: number | null = null;

    if (previousPrice && previousPrice > 0) {
      changePercent = Math.round(((unitPrice - previousPrice) / previousPrice) * 10000) / 100;
    }

    // Record new price
    await this.supabase.from("vendor_price_history").insert({
      vendor_id: vendorId,
      item_description: itemDescription,
      unit_price: unitPrice,
      unit,
    });

    return { previousPrice, changePercent };
  }
}
