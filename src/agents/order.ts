import { BaseAgent, AgentEvent, Severity } from "./base-agent";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vertex-autopilot.vercel.app";

export class OrderAgent extends BaseAgent {
  constructor() {
    super("order_manager");
  }

  async check(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const stale = await this.checkStaleOrders();
    events.push(...stale);
    return events;
  }

  /** Flag orders older than 30 min that aren't completed/cancelled */
  async checkStaleOrders(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: stale } = await this.supabase
      .from("orders")
      .select("*, locations!inner(name)")
      .in("status", ["new", "preparing"])
      .lt("created_at", thirtyMinsAgo);

    if (!stale) return events;

    for (const order of stale) {
      const elapsedMins = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);
      const locationName = (order.locations as { name: string }).name;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "stale_order")
        .eq("metadata->>order_id", order.id)
        .gte("created_at", todayStart.toISOString())
        .single();

      if (existing) continue;

      const severity: Severity = elapsedMins > 60 ? "warning" : "info";

      const event: AgentEvent = {
        agent_type: "order_manager",
        event_type: "stale_order",
        location_id: order.location_id,
        severity,
        description: `📞 Order #${order.order_number} (${order.channel}) is ${elapsedMins} mins old — ${order.status}`,
        action_taken: "Manager alerted to check on order",
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          channel: order.channel,
          elapsed_mins: elapsedMins,
          location_name: locationName,
        },
      };

      await this.logEvent(event);

      if (elapsedMins > 45) {
        await this.notify(
          severity,
          { name: "Manager" },
          `⚠️ Stale Order: #${order.order_number} (${order.channel}) — ${elapsedMins} min — ${order.status}\n${BASE_URL}/dashboard/orders`,
          `Stale Order Alert — #${order.order_number}`,
          `<div style="font-family:sans-serif;padding:20px;background:#111827;color:white;border-radius:12px;">
            <h2 style="color:#fbbf24;">⚠️ Stale Order Alert</h2>
            <p><strong>Order #${order.order_number}</strong> — ${order.channel}</p>
            <p>Status: ${order.status} | ${elapsedMins} minutes old</p>
            <p>Location: ${locationName}</p>
            <a href="${BASE_URL}/dashboard/orders" style="color:#60a5fa;">View in Dashboard →</a>
          </div>`,
          undefined,
          order.location_id
        );
      }

      events.push(event);
    }

    return events;
  }
}
