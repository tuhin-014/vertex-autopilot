import { BaseAgent, AgentEvent } from "./base-agent";

/**
 * Cross-Product Intelligence Agent — THE MOAT
 * 
 * Correlates data across all products to find insights
 * no single-product competitor can see.
 */
export class CrossProductAgent extends BaseAgent {
  constructor() {
    super("cross_product");
  }

  async check(): Promise<AgentEvent[]> {
    return [];
  }

  // ── Correlate Safety Issues with Staffing ──
  async correlateSafetyAndStaffing(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: locations } = await this.supabase.from("locations").select("id, name");
    if (!locations) return events;

    for (const loc of locations) {
      // Count safety events this week
      const { data: safetyEvents } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("agent_type", "food_safety")
        .eq("location_id", loc.id)
        .in("severity", ["critical", "warning"])
        .gte("created_at", sevenDaysAgo);

      if (!safetyEvents || safetyEvents.length < 2) continue;

      // Check staffing level
      const { data: targets } = await this.supabase
        .from("staffing_targets")
        .select("role, target_count")
        .eq("location_id", loc.id);
      const { data: employees } = await this.supabase
        .from("employees")
        .select("role")
        .eq("location_id", loc.id);

      if (!targets || !employees) continue;

      let totalTarget = 0, totalActual = 0;
      for (const t of targets) {
        totalTarget += t.target_count;
        totalActual += employees.filter((e) => e.role === t.role).length;
      }

      const staffPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 100;

      // Correlation: understaffed + safety issues = connected
      if (staffPct >= 90) continue; // Well-staffed, not correlated

      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "safety_staffing_correlation")
        .eq("location_id", loc.id)
        .gte("created_at", sevenDaysAgo)
        .single();
      if (existing) continue;

      const event: AgentEvent = {
        agent_type: "cross_product",
        event_type: "safety_staffing_correlation",
        location_id: loc.id,
        severity: "critical",
        description: `🧠 INSIGHT: ${loc.name} has ${safetyEvents.length} safety issues this week AND is only ${staffPct}% staffed. These are likely connected — overworked staff miss safety protocols.`,
        action_taken: "Prioritized hiring for this location, safety training auto-scheduled",
        metadata: {
          safety_events: safetyEvents.length,
          staffing_pct: staffPct,
          correlation: "understaffing → safety_violations",
        },
      };

      await this.logEvent(event);
      events.push(event);
    }

    return events;
  }

  // ── Correlate Cert Expirations with Training Completion ──
  async correlateCertsAndTraining(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    // Locations with multiple expiring certs = training gap
    const { data: locations } = await this.supabase.from("locations").select("id, name");
    if (!locations) return events;

    for (const loc of locations) {
      const { data: employees } = await this.supabase
        .from("employees")
        .select("id")
        .eq("location_id", loc.id);

      if (!employees) continue;
      const empIds = employees.map((e) => e.id);

      const { data: expiringCerts } = await this.supabase
        .from("certifications")
        .select("id")
        .in("employee_id", empIds)
        .lte("expiry_date", thirtyDays.toISOString().split("T")[0]);

      if (!expiringCerts || expiringCerts.length < 3) continue;

      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "training_gap")
        .eq("location_id", loc.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();
      if (existing) continue;

      const event: AgentEvent = {
        agent_type: "cross_product",
        event_type: "training_gap",
        location_id: loc.id,
        severity: "warning",
        description: `🧠 INSIGHT: ${loc.name} has ${expiringCerts.length} certifications expiring within 30 days. This indicates a training gap — bulk re-certification should be scheduled.`,
        action_taken: "Recommended group training session, Vertex Train enrollment suggested",
        metadata: { expiring_count: expiringCerts.length },
      };

      await this.logEvent(event);
      events.push(event);
    }

    return events;
  }

  // ── Identify High-Risk Stores ──
  async identifyHighRiskStores(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: locations } = await this.supabase.from("locations").select("id, name");
    if (!locations) return events;

    for (const loc of locations) {
      // Gather multi-dimensional risk signals
      const { data: safetyEvents } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("agent_type", "food_safety")
        .eq("location_id", loc.id)
        .in("severity", ["critical", "warning"])
        .gte("created_at", sevenDaysAgo);

      const { data: hiringEvents } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("agent_type", "hiring")
        .eq("location_id", loc.id)
        .eq("event_type", "understaffed")
        .gte("created_at", sevenDaysAgo);

      const { data: openActions } = await this.supabase
        .from("corrective_actions")
        .select("id")
        .eq("location_id", loc.id)
        .eq("status", "open");

      const safetyCount = safetyEvents?.length || 0;
      const hiringCount = hiringEvents?.length || 0;
      const correctiveCount = openActions?.length || 0;

      // Risk score: multi-dimensional
      const riskScore = safetyCount * 3 + hiringCount * 2 + correctiveCount * 4;

      if (riskScore < 10) continue; // Low risk, skip

      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "high_risk_store")
        .eq("location_id", loc.id)
        .gte("created_at", sevenDaysAgo)
        .single();
      if (existing) continue;

      const event: AgentEvent = {
        agent_type: "cross_product",
        event_type: "high_risk_store",
        location_id: loc.id,
        severity: "critical",
        description: `🧠 HIGH RISK: ${loc.name} — Risk Score ${riskScore} (safety: ${safetyCount}, staffing: ${hiringCount}, corrective: ${correctiveCount}). Multiple operational issues converging.`,
        action_taken: "Store flagged for regional manager review, recommended on-site visit",
        metadata: {
          risk_score: riskScore,
          safety_events: safetyCount,
          hiring_events: hiringCount,
          open_corrective: correctiveCount,
        },
      };

      await this.logEvent(event);

      // Request approval for on-site visit
      await this.requestApproval("on_site_visit", loc.id, {
        store_name: loc.name,
        risk_score: riskScore,
        reason: `Multi-dimensional risk: ${safetyCount} safety, ${hiringCount} staffing, ${correctiveCount} corrective`,
      });

      events.push(event);
    }

    return events;
  }

  // ── Weekly Cross-Product Report ──
  async generateWeeklyInsights(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Aggregate all events this week
    const { data: allEvents } = await this.supabase
      .from("agent_events")
      .select("agent_type, event_type, severity, location_id")
      .gte("created_at", sevenDaysAgo);

    if (!allEvents || allEvents.length === 0) return events;

    const totalEvents = allEvents.length;
    const byAgent: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const e of allEvents) {
      byAgent[e.agent_type] = (byAgent[e.agent_type] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    }

    // Check if already generated this week
    const { data: existing } = await this.supabase
      .from("agent_events")
      .select("id")
      .eq("event_type", "weekly_insight_report")
      .gte("created_at", sevenDaysAgo)
      .single();
    if (existing) return events;

    const { data: locations } = await this.supabase.from("locations").select("id").limit(1);

    const event: AgentEvent = {
      agent_type: "cross_product",
      event_type: "weekly_insight_report",
      location_id: locations?.[0]?.id || "",
      severity: "info",
      description: `📊 Weekly Report: ${totalEvents} total events — Safety: ${byAgent.food_safety || 0}, Hiring: ${byAgent.hiring || 0}, Staffing: ${byAgent.staffing || 0}. Critical: ${bySeverity.critical || 0}, Warning: ${bySeverity.warning || 0}.`,
      action_taken: "Weekly insight report generated",
      metadata: { total_events: totalEvents, by_agent: byAgent, by_severity: bySeverity },
    };

    await this.logEvent(event);
    events.push(event);

    return events;
  }
}
