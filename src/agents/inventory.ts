import { BaseAgent, AgentEvent, Severity } from "./base-agent";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vertex-autopilot.vercel.app";

export class InventoryAgent extends BaseAgent {
  constructor() {
    super("inventory");
  }

  async check(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const belowPar = await this.checkBelowPar();
    const expiring = await this.checkExpiringItems();
    const suggestedPOs = await this.generateSuggestedPOs();
    events.push(...belowPar, ...expiring, ...suggestedPOs);
    return events;
  }

  /** Flag items below par level */
  async checkBelowPar(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    const { data: items } = await this.supabase
      .from("inventory_items")
      .select("*, vendors:preferred_vendor_id(name)")
      .not("par_level", "is", null);

    if (!items) return events;

    for (const item of items) {
      if (Number(item.current_stock) >= Number(item.par_level)) continue;

      // Check if already alerted today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "below_par")
        .eq("metadata->>item_id", item.id)
        .gte("created_at", todayStart.toISOString())
        .single();

      if (existing) continue;

      const deficit = Number(item.par_level) - Number(item.current_stock);
      const vendorName = (item.vendors as { name: string } | null)?.name || "No vendor";
      const pctOfPar = Math.round((Number(item.current_stock) / Number(item.par_level)) * 100);
      const severity: Severity = pctOfPar < 25 ? "critical" : pctOfPar < 50 ? "warning" : "info";

      const event: AgentEvent = {
        agent_type: "inventory",
        event_type: "below_par",
        location_id: item.location_id,
        severity,
        description: `📦 ${item.name} below par: ${item.current_stock}/${item.par_level} ${item.unit} (need ${deficit} more from ${vendorName})`,
        action_taken: severity === "critical" ? "Urgent reorder alert sent" : "Below-par alert logged",
        metadata: {
          item_id: item.id,
          item_name: item.name,
          current_stock: item.current_stock,
          par_level: item.par_level,
          deficit,
          vendor: vendorName,
          pct_of_par: pctOfPar,
        },
      };

      await this.logEvent(event);

      if (severity === "critical" && item.location_id) {
        await this.notify(
          "critical",
          { name: "Manager" },
          `🚨 LOW STOCK: ${item.name} at ${pctOfPar}% of par (${item.current_stock}/${item.par_level} ${item.unit}). Order ${deficit} ${item.unit} from ${vendorName}.\n${BASE_URL}/dashboard/inventory/alerts`,
          `Low Stock Alert — ${item.name}`,
          `<div style="font-family:sans-serif;padding:20px;background:#111827;color:white;border-radius:12px;">
            <h2 style="color:#f87171;">📦 Low Stock Alert</h2>
            <p><strong>${item.name}</strong> — ${item.current_stock}/${item.par_level} ${item.unit}</p>
            <p>Order ${deficit} ${item.unit} from ${vendorName}</p>
            <a href="${BASE_URL}/dashboard/inventory/alerts" style="color:#60a5fa;">View Alerts →</a>
          </div>`,
          undefined,
          item.location_id
        );
      }

      events.push(event);
    }

    return events;
  }

  /** Check for items approaching expiration (based on shelf_life_days and last_counted_at) */
  async checkExpiringItems(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    const { data: items } = await this.supabase
      .from("inventory_items")
      .select("*")
      .not("shelf_life_days", "is", null)
      .not("last_counted_at", "is", null)
      .gt("current_stock", 0);

    if (!items) return events;

    const now = Date.now();

    for (const item of items) {
      const countedAt = new Date(item.last_counted_at).getTime();
      const shelfLifeMs = item.shelf_life_days * 24 * 60 * 60 * 1000;
      const expiresAt = countedAt + shelfLifeMs;
      const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

      if (daysLeft > 3) continue; // Only alert for items expiring within 3 days

      // Check if already alerted today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "expiring_item")
        .eq("metadata->>item_id", item.id)
        .gte("created_at", todayStart.toISOString())
        .single();

      if (existing) continue;

      const severity: Severity = daysLeft <= 0 ? "critical" : daysLeft <= 1 ? "warning" : "info";

      const event: AgentEvent = {
        agent_type: "inventory",
        event_type: "expiring_item",
        location_id: item.location_id,
        severity,
        description: daysLeft <= 0
          ? `🗑️ ${item.name} has EXPIRED (${item.current_stock} ${item.unit} in ${item.storage_location || "storage"})`
          : `⏰ ${item.name} expires in ${daysLeft} day(s) — ${item.current_stock} ${item.unit} in ${item.storage_location || "storage"}`,
        action_taken: daysLeft <= 0 ? "FIFO alert — remove from service immediately" : "FIFO alert — use first",
        metadata: {
          item_id: item.id,
          item_name: item.name,
          days_left: daysLeft,
          stock: item.current_stock,
          storage: item.storage_location,
        },
      };

      await this.logEvent(event);
      events.push(event);
    }

    return events;
  }

  /** Auto-generate suggested POs for below-par items, grouped by vendor */
  async generateSuggestedPOs(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get below-par items with a preferred vendor
    const { data: items } = await this.supabase
      .from("inventory_items")
      .select("*, vendors:preferred_vendor_id(id, name)")
      .not("par_level", "is", null)
      .not("preferred_vendor_id", "is", null);

    if (!items) return events;

    // Group below-par items by vendor+location
    const groups: Record<string, typeof items> = {};
    for (const item of items) {
      if (Number(item.current_stock) >= Number(item.par_level)) continue;
      const key = `${item.location_id}::${item.preferred_vendor_id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    for (const [key, groupItems] of Object.entries(groups)) {
      if (groupItems.length === 0) continue;
      const [locationId, vendorId] = key.split("::");
      const vendorName = (groupItems[0].vendors as { id: string; name: string })?.name || "Unknown";

      // Check if there's already a draft PO for this vendor/location
      const { data: existingPO } = await this.supabase
        .from("purchase_orders")
        .select("id")
        .eq("location_id", locationId)
        .eq("vendor_id", vendorId)
        .eq("status", "draft")
        .single();

      if (existingPO) continue; // Already have a draft

      // Create PO
      let totalEstimated = 0;
      const poItems = groupItems.map((item) => {
        const orderQty = Number(item.max_level || item.par_level) - Number(item.current_stock);
        const estTotal = orderQty * Number(item.unit_cost || 0);
        totalEstimated += estTotal;
        return {
          item_id: item.id,
          quantity: orderQty,
          unit: item.unit,
          estimated_unit_cost: item.unit_cost,
          estimated_total: estTotal,
        };
      });

      const { data: po } = await this.supabase
        .from("purchase_orders")
        .insert({
          location_id: locationId,
          vendor_id: vendorId,
          status: "draft",
          total_estimated: totalEstimated,
          notes: `Auto-generated: ${groupItems.length} items below par`,
        })
        .select("id")
        .single();

      if (po) {
        // Insert PO items
        await this.supabase
          .from("purchase_order_items")
          .insert(poItems.map((pi) => ({ ...pi, po_id: po.id })));

        // Create approval queue item
        await this.requestApproval("purchase_order", locationId, {
          po_id: po.id,
          vendor: vendorName,
          item_count: groupItems.length,
          total_estimated: totalEstimated,
        });

        const event: AgentEvent = {
          agent_type: "inventory",
          event_type: "po_generated",
          location_id: locationId,
          severity: "info",
          description: `📋 Auto-PO created for ${vendorName}: ${groupItems.length} items, ~$${totalEstimated.toFixed(2)}`,
          action_taken: "Draft PO created, pending manager approval",
          metadata: { po_id: po.id, vendor: vendorName, items: groupItems.length, total: totalEstimated },
        };

        await this.logEvent(event);
        events.push(event);
      }
    }

    return events;
  }
}
