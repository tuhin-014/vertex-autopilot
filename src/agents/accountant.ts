import { BaseAgent, AgentEvent } from "./base-agent";

export class AccountantAgent extends BaseAgent {
  constructor() {
    super("accountant");
  }

  async check(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    const { data: locations } = await this.supabase.from("locations").select("id, name");
    if (!locations) return events;

    for (const loc of locations) {
      const { data: orders } = await this.supabase
        .from("orders")
        .select("total, status")
        .eq("location_id", loc.id)
        .gte("created_at", `${dateStr}T00:00:00`)
        .lte("created_at", `${dateStr}T23:59:59`)
        .eq("status", "completed");

      const revenue = (orders || []).reduce((s: number, o: any) => s + Number(o.total || 0), 0);
      const orderCount = (orders || []).length;
      const avgTicket = orderCount > 0 ? revenue / orderCount : 0;

      const { data: invoices } = await this.supabase
        .from("invoices")
        .select("total")
        .eq("location_id", loc.id)
        .eq("status", "approved")
        .gte("invoice_date", dateStr);

      const foodCost = (invoices || []).reduce((s: number, i: any) => s + Number(i.total || 0), 0);

      const { data: staffing } = await this.supabase
        .from("staffing_targets")
        .select("target_count")
        .eq("location_id", loc.id);

      const headcount = staffing?.[0]?.target_count || 10;
      const laborCost = headcount * 15 * 6;
      const otherExpenses = revenue * 0.08;
      const netProfit = revenue - foodCost - laborCost - otherExpenses;
      const foodCostPct = revenue > 0 ? (foodCost / revenue) * 100 : 0;
      const laborCostPct = revenue > 0 ? (laborCost / revenue) * 100 : 0;

      await this.supabase.from("daily_financials").upsert({
        location_id: loc.id,
        date: dateStr,
        revenue,
        food_cost: foodCost,
        labor_cost: laborCost,
        other_expenses: otherExpenses,
        net_profit: netProfit,
        food_cost_pct: Math.round(foodCostPct * 10) / 10,
        labor_cost_pct: Math.round(laborCostPct * 10) / 10,
        order_count: orderCount,
        avg_ticket: Math.round(avgTicket * 100) / 100,
      }, { onConflict: "location_id,date" });

      if (foodCostPct > 35 && revenue > 0) {
        events.push({
          agent_type: "accountant",
          event_type: "high_food_cost",
          location_id: loc.id,
          severity: "warning",
          description: `${loc.name}: Food cost at ${foodCostPct.toFixed(1)}% (target: <35%)`,
          metadata: { food_cost_pct: foodCostPct, revenue, food_cost: foodCost },
        });
      }

      if (laborCostPct > 35 && revenue > 0) {
        events.push({
          agent_type: "accountant",
          event_type: "high_labor_cost",
          location_id: loc.id,
          severity: "warning",
          description: `${loc.name}: Labor cost at ${laborCostPct.toFixed(1)}% (target: <35%)`,
          metadata: { labor_cost_pct: laborCostPct, revenue, labor_cost: laborCost },
        });
      }

      if (netProfit < 0 && revenue > 0) {
        events.push({
          agent_type: "accountant",
          event_type: "daily_loss",
          location_id: loc.id,
          severity: "critical",
          description: `${loc.name}: Daily LOSS of $${Math.abs(netProfit).toFixed(2)}`,
          metadata: { net_profit: netProfit, revenue },
        });
      }
    }

    // Log all events
    for (const event of events) {
      await this.logEvent(event);
    }

    return events;
  }
}

export const accountantAgent = new AccountantAgent();
