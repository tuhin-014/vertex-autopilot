import { BaseAgent, AgentEvent } from "./base-agent";

export class SpendOptimizer extends BaseAgent {
  constructor() {
    super("spend_optimizer");
  }

  async check(): Promise<AgentEvent[]> {
    return [];
  }

  // ── Detect Spending Anomalies ──
  // Compares current corrective actions and events to detect unusual patterns
  async detectAnomalies(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: locations } = await this.supabase.from("locations").select("id, name");
    if (!locations) return events;

    for (const loc of locations) {
      // Count corrective actions (proxy for operational cost/issues)
      const { data: recentActions } = await this.supabase
        .from("corrective_actions")
        .select("id")
        .eq("location_id", loc.id)
        .gte("created_at", sevenDaysAgo);

      const { data: monthActions } = await this.supabase
        .from("corrective_actions")
        .select("id")
        .eq("location_id", loc.id)
        .gte("created_at", thirtyDaysAgo);

      const recentCount = recentActions?.length || 0;
      const monthCount = monthActions?.length || 0;
      const weeklyAvg = monthCount / 4;

      // Anomaly: this week's count is 2x+ the monthly average
      if (recentCount < 3 || recentCount < weeklyAvg * 2) continue;

      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "spending_anomaly")
        .eq("location_id", loc.id)
        .gte("created_at", sevenDaysAgo)
        .single();
      if (existing) continue;

      const event: AgentEvent = {
        agent_type: "spend_optimizer",
        event_type: "spending_anomaly",
        location_id: loc.id,
        severity: "warning",
        description: `📊 ${loc.name} — ${recentCount} corrective actions this week (avg: ${weeklyAvg.toFixed(1)}/wk). Operational issue spike detected.`,
        action_taken: "Alert sent to regional for investigation",
        metadata: { recent_count: recentCount, monthly_count: monthCount, weekly_avg: weeklyAvg },
      };

      await this.logEvent(event);
      events.push(event);
    }

    return events;
  }

  // ── Track Overdue Corrective Action Costs ──
  async trackOverdueCosts(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Long-overdue corrective actions = potential fines/violations
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: overdueActions } = await this.supabase
      .from("corrective_actions")
      .select("*, locations!inner(name)")
      .eq("status", "open")
      .lte("created_at", fortyEightHoursAgo);

    if (!overdueActions || overdueActions.length === 0) return events;

    // Group by location
    const byLocation: Record<string, { count: number; name: string; locationId: string }> = {};
    for (const a of overdueActions) {
      const locName = (a.locations as Record<string, string>).name;
      if (!byLocation[a.location_id]) {
        byLocation[a.location_id] = { count: 0, name: locName, locationId: a.location_id };
      }
      byLocation[a.location_id].count++;
    }

    for (const [locationId, data] of Object.entries(byLocation)) {
      if (data.count < 2) continue;

      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "overdue_cost_risk")
        .eq("location_id", locationId)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();
      if (existing) continue;

      // Estimated fine risk: $500-$2000 per unresolved violation
      const estimatedRisk = data.count * 1250;

      const event: AgentEvent = {
        agent_type: "spend_optimizer",
        event_type: "overdue_cost_risk",
        location_id: locationId,
        severity: "critical",
        description: `💰 ${data.name} — ${data.count} overdue corrective actions (48h+). Estimated fine risk: $${estimatedRisk.toLocaleString()}`,
        action_taken: "Cost risk alert sent to regional manager",
        metadata: { overdue_count: data.count, estimated_risk: estimatedRisk },
      };

      await this.logEvent(event);
      events.push(event);
    }

    return events;
  }
}
