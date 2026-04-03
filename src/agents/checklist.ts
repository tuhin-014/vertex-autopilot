import { BaseAgent, AgentEvent, Severity } from "./base-agent";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vertex-autopilot.vercel.app";

export class ChecklistAgent extends BaseAgent {
  constructor() {
    super("checklist_manager");
  }

  async check(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const missed = await this.checkMissedChecklists();
    events.push(...missed);
    return events;
  }

  /** Alert if opening checklist not done 30 min after shift start, or closing not done 30 min after close */
  async checkMissedChecklists(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const today = new Date().toISOString().split("T")[0];

    // Check opening checklists (should be done by ~9:30 AM for a 9 AM shift)
    const { data: openingMissed } = await this.supabase
      .from("checklist_completions")
      .select("*, checklist_templates:template_id(name, deadline_minutes, location_id:location_id(locations!inner(name)))")
      .eq("shift_date", today)
      .eq("shift_type", "opening")
      .neq("status", "completed")
      .eq("locations!inner(id)", this.supabase.rpc("get_first_location_id") || "");

    // More practical: just look at all in_progress/incomplete opening and closing for today
    const { data: todayChecklists } = await this.supabase
      .from("checklist_completions")
      .select("*, checklist_templates:template_id(name, deadline_minutes)")
      .eq("shift_date", today)
      .in("shift_type", ["opening", "closing"])
      .in("status", ["in_progress", "incomplete"]);

    if (!todayChecklists) return events;

    const now = Date.now();

    for (const cl of todayChecklists) {
      // Check if deadline has passed
      const deadlineMinutes = cl.checklist_templates?.deadline_minutes || 60;
      const startedAt = new Date(cl.started_at).getTime();
      const deadlineMs = startedAt + deadlineMinutes * 60 * 1000;

      if (now < deadlineMs) continue; // Not past deadline yet

      // Check if we already alerted today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: existing } = await this.supabase
        .from("checklist_alerts")
        .select("id")
        .eq("checklist_completion_id", cl.id)
        .eq("alert_type", "missed_deadline")
        .gte("sent_at", todayStart.toISOString())
        .single();

      if (existing) continue;

      const minsLate = Math.round((now - deadlineMs) / 60000);
      const severity: Severity = minsLate > 60 ? "warning" : "info";

      // Log to alerts table
      await this.supabase.from("checklist_alerts").insert({
        location_id: cl.location_id,
        checklist_completion_id: cl.id,
        alert_type: "missed_deadline",
        message: `${cl.checklist_templates?.name || cl.shift_type} checklist is ${minsLate} minutes past deadline`,
        sent_via: "sms",
      });

      const event: AgentEvent = {
        agent_type: "checklist_manager",
        event_type: "missed_checklist",
        location_id: cl.location_id,
        severity,
        description: `🔐 ${cl.shift_type} checklist for ${cl.checklist_templates?.name || cl.shift_type} is ${minsLate} min overdue — ${cl.completed_by} started it`,
        action_taken: "Alert sent to manager",
        metadata: {
          completion_id: cl.id,
          template_name: cl.checklist_templates?.name,
          shift_type: cl.shift_type,
          mins_late: minsLate,
          completion_pct: cl.completion_pct,
        },
      };

      await this.logEvent(event);

      await this.notify(
        severity,
        { name: "Manager" },
        `🔐 Checklist Alert: ${cl.checklist_templates?.name || cl.shift_type} — ${minsLate} min past deadline\n${BASE_URL}/dashboard/checklists/${cl.id}`,
        `Checklist Overdue — ${cl.checklist_templates?.name}`,
        `<div style="font-family:sans-serif;padding:20px;background:#111827;color:white;border-radius:12px;">
          <h2 style="color:#fbbf24;">🔐 Checklist Overdue</h2>
          <p><strong>${cl.checklist_templates?.name || cl.shift_type}</strong></p>
          <p>Started by: ${cl.completed_by}</p>
          <p>Completion: ${cl.completion_pct}%</p>
          <p>${minsLate} minutes past deadline</p>
          <a href="${BASE_URL}/dashboard/checklists/${cl.id}" style="color:#60a5fa;">View Checklist →</a>
        </div>`,
        undefined,
        cl.location_id
      );

      events.push(event);
    }

    return events;
  }
}
