import { BaseAgent, AgentEvent } from "./base-agent";
import { sendSMS } from "@/lib/sms/twilio";

export class StaffingAgent extends BaseAgent {
  constructor() {
    super("staffing");
  }

  async check(): Promise<AgentEvent[]> {
    return [];
  }

  // ── Predict Busy Days (based on day-of-week patterns) ──
  async predictBusyDays(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay(); // 0=Sun, 6=Sat

    // IHOP busy patterns: weekends, holidays
    const busyDays = [0, 5, 6]; // Sun, Fri, Sat
    const isBusy = busyDays.includes(dayOfWeek);

    if (!isBusy) return events;

    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];

    const { data: locations } = await this.supabase.from("locations").select("id, name");
    if (!locations) return events;

    for (const loc of locations) {
      // Check if fully staffed for tomorrow
      const { data: targets } = await this.supabase
        .from("staffing_targets")
        .select("role, target_count")
        .eq("location_id", loc.id);

      const { data: employees } = await this.supabase
        .from("employees")
        .select("role")
        .eq("location_id", loc.id);

      if (!targets || !employees) continue;

      const understaffedRoles: string[] = [];
      for (const t of targets) {
        const actual = employees.filter((e) => e.role === t.role).length;
        if (actual < t.target_count) {
          understaffedRoles.push(`${t.role} (${actual}/${t.target_count})`);
        }
      }

      if (understaffedRoles.length === 0) continue;

      // Check if already alerted today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "busy_day_warning")
        .eq("location_id", loc.id)
        .gte("created_at", todayStart.toISOString())
        .single();
      if (existing) continue;

      const event: AgentEvent = {
        agent_type: "staffing",
        event_type: "busy_day_warning",
        location_id: loc.id,
        severity: "warning",
        description: `📅 ${dayName} is typically busy — ${loc.name} is understaffed: ${understaffedRoles.join(", ")}`,
        action_taken: "Alert sent to manager to arrange coverage",
        metadata: { day: dayName, understaffed_roles: understaffedRoles },
      };

      await this.logEvent(event);

      // Notify manager
      const { data: manager } = await this.supabase
        .from("employees")
        .select("phone, email, name")
        .eq("location_id", loc.id)
        .eq("role", "manager")
        .limit(1)
        .single();

      if (manager?.phone) {
        await sendSMS(manager.phone,
          `📅 Heads up: ${dayName} is typically busy.\n${loc.name} is short: ${understaffedRoles.join(", ")}.\nConsider calling in extra staff.\n—Vertex Staffing`
        );
      }

      events.push(event);
    }

    return events;
  }

  // ── Detect No-Show Patterns ──
  async detectNoShowPatterns(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Check agent_events for repeated "understaffed" at same location
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: locations } = await this.supabase.from("locations").select("id, name");
    if (!locations) return events;

    for (const loc of locations) {
      const { data: understaffedEvents } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "understaffed")
        .eq("location_id", loc.id)
        .gte("created_at", thirtyDaysAgo);

      if (!understaffedEvents || understaffedEvents.length < 5) continue;

      // Check if already flagged this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "chronic_understaffing")
        .eq("location_id", loc.id)
        .gte("created_at", weekAgo)
        .single();
      if (existing) continue;

      const event: AgentEvent = {
        agent_type: "staffing",
        event_type: "chronic_understaffing",
        location_id: loc.id,
        severity: "critical",
        description: `🔄 ${loc.name} has been understaffed ${understaffedEvents.length} times in 30 days — systemic issue`,
        action_taken: "Escalated to regional, hiring priority increased",
        metadata: { occurrence_count: understaffedEvents.length },
      };

      await this.logEvent(event);
      events.push(event);
    }

    return events;
  }
}
