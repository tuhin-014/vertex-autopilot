import { BaseAgent, AgentEvent } from "./base-agent";

export class WasteAgent extends BaseAgent {
  constructor() {
    super("waste");
  }

  async check(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: wasteData } = await this.supabase
      .from("waste_logs")
      .select("*, inventory_items(name, category)")
      .gte("logged_at", yesterday.toISOString());

    if (!wasteData || wasteData.length === 0) return events;

    const totalCost = wasteData.reduce((s: number, w: any) => s + Number(w.estimated_cost || 0), 0);
    const locId = (wasteData[0] as any)?.location_id || "all";

    if (totalCost > 100) {
      events.push({
        agent_type: "waste",
        event_type: "high_waste_day",
        location_id: locId,
        severity: "warning",
        description: `High waste day: $${totalCost.toFixed(2)} total across ${wasteData.length} items`,
        metadata: { items: wasteData.length, cost: totalCost },
      });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weekWaste } = await this.supabase
      .from("waste_logs")
      .select("*, inventory_items(name)")
      .gte("logged_at", weekAgo.toISOString());

    if (weekWaste) {
      const counts: Record<string, { name: string; qty: number; cost: number }> = {};
      for (const w of weekWaste as any[]) {
        const key = w.item_id || "unknown";
        if (!counts[key]) counts[key] = { name: w.inventory_items?.name || "Unknown", qty: 0, cost: 0 };
        counts[key].qty += Number(w.quantity || 0);
        counts[key].cost += Number(w.estimated_cost || 0);
      }
      for (const [, info] of Object.entries(counts)) {
        if (info.qty > 10) {
          events.push({
            agent_type: "waste",
            event_type: "waste_pattern",
            location_id: locId,
            severity: "info",
            description: `${info.name} wasted ${info.qty}x this week ($${info.cost.toFixed(2)}) — consider reducing order`,
            action_taken: "Added to waste_reports for manager review",
            metadata: { weekly_qty: info.qty, weekly_cost: info.cost },
          });
        }
      }
    }

    for (const event of events) {
      await this.logEvent(event);
    }

    return events;
  }
}

export const wasteAgent = new WasteAgent();
