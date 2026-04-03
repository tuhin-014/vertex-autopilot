import { BaseAgent, AgentEvent, Severity } from "./base-agent";
import { missedLogSMS, outOfRangeSMS, certExpiringSMS, escalationSMS } from "@/lib/sms/twilio";
import { certWarningHTML } from "@/lib/email/send";

const COLD_MAX = 41; // °F — above this = violation for cold storage
const HOT_MIN = 135; // °F — below this = violation for hot hold

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vertex-autopilot.vercel.app";

export class FoodSafetyAgent extends BaseAgent {
  constructor() {
    super("food_safety");
  }

  async check(): Promise<AgentEvent[]> {
    // This is the orchestrator — called by individual cron endpoints
    return [];
  }

  // ── 1. Check Missed Temp Logs ──
  async checkMissedTempLogs(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const now = new Date();
    const currentHour = now.getUTCHours() - 4; // EST offset (approximate)
    const currentTime = `${String(Math.max(0, currentHour)).padStart(2, "0")}:00`;

    // Get all schedules
    const { data: schedules } = await this.supabase
      .from("temp_log_schedule")
      .select("*, locations!inner(id, name, organization_id)");

    if (!schedules) return events;

    for (const schedule of schedules) {
      // Find the most recent scheduled time that should have been logged
      const scheduledTimes: string[] = schedule.scheduled_times || [];
      const graceMins = schedule.grace_period_min || 30;

      for (const schedTime of scheduledTimes) {
        const [schedHour, schedMin] = schedTime.split(":").map(Number);
        const [curHour] = currentTime.split(":").map(Number);

        // Only check times that have passed (with grace period)
        if (schedHour > curHour) continue;
        if (schedHour === curHour) continue; // still within current hour

        // Check if a temp log exists for this equipment at this location within the time window
        const windowStart = new Date(now);
        windowStart.setHours(schedHour + 4, schedMin, 0, 0); // Convert back to UTC
        const windowEnd = new Date(windowStart);

        const { data: logs } = await this.supabase
          .from("temp_logs")
          .select("id")
          .eq("location_id", schedule.location_id)
          .eq("equipment", schedule.equipment_name)
          .gte("recorded_at", windowStart.toISOString())
          .lte("recorded_at", windowEnd.toISOString());

        if (!logs || logs.length === 0) {
          // MISSED LOG — get the assigned cook
          const { data: cook } = await this.supabase
            .from("employees")
            .select("id, name, phone, email")
            .eq("location_id", schedule.location_id)
            .eq("role", schedule.assigned_role || "cook")
            .limit(1)
            .single();

          // Check if we already alerted for this exact missed log today
          const { data: existingAlert } = await this.supabase
            .from("agent_events")
            .select("id")
            .eq("location_id", schedule.location_id)
            .eq("event_type", "missed_log")
            .eq("metadata->>equipment", schedule.equipment_name)
            .eq("metadata->>scheduled_time", schedTime)
            .gte("created_at", windowStart.toISOString())
            .single();

          if (existingAlert) continue; // Already alerted

          const locationName = schedule.locations?.name || "Unknown Store";

          const event: AgentEvent = {
            agent_type: "food_safety",
            event_type: "missed_log",
            location_id: schedule.location_id,
            severity: "warning" as Severity,
            description: `Missed temp log: ${schedule.equipment_name} at ${locationName} (scheduled ${schedTime})`,
            action_taken: cook ? `SMS sent to ${cook.name}` : "No cook assigned",
            metadata: {
              equipment: schedule.equipment_name,
              scheduled_time: schedTime,
              cook_id: cook?.id,
            },
          };

          const loggedEvent = await this.logEvent(event);

          // Send SMS to cook
          if (cook?.phone) {
            const smsBody = missedLogSMS(
              locationName,
              schedule.equipment_name,
              cook.name,
              `${BASE_URL}/dashboard/safety`
            );
            await this.notify("warning", { phone: cook.phone, email: cook.email, name: cook.name }, smsBody, undefined, undefined, loggedEvent.id);
          }

          events.push(event);
        }
      }
    }

    return events;
  }

  // ── 2. Check Out-of-Range Temperatures ──
  async checkOutOfRange(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const { data: logs } = await this.supabase
      .from("temp_logs")
      .select("*, locations!inner(name)")
      .gte("recorded_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // last hour
      .order("recorded_at", { ascending: false });

    if (!logs) return events;

    for (const log of logs) {
      const temp = log.temperature;
      const equipment = log.equipment?.toLowerCase() || "";

      // Determine safe range
      let isOutOfRange = false;
      let safeRange = "";

      if (equipment.includes("freezer") || equipment.includes("cold")) {
        if (temp > COLD_MAX) {
          isOutOfRange = true;
          safeRange = `≤${COLD_MAX}°F`;
        }
      } else if (equipment.includes("hot") || equipment.includes("warmer")) {
        if (temp < HOT_MIN) {
          isOutOfRange = true;
          safeRange = `≥${HOT_MIN}°F`;
        }
      }

      if (!isOutOfRange) continue;

      // Check if we already flagged this log
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("metadata->>temp_log_id", log.id)
        .single();

      if (existing) continue;

      const locationName = log.locations?.name || "Unknown Store";

      // Find the cook on duty
      const { data: cook } = await this.supabase
        .from("employees")
        .select("name, phone, email")
        .eq("location_id", log.location_id)
        .eq("role", "cook")
        .limit(1)
        .single();

      const event: AgentEvent = {
        agent_type: "food_safety",
        event_type: "temp_violation",
        location_id: log.location_id,
        severity: "critical" as Severity,
        description: `⚠️ ${equipment} at ${locationName}: ${temp}°F (safe: ${safeRange})`,
        action_taken: cook ? `SMS sent to ${cook.name}` : "No cook found",
        metadata: {
          temperature: temp,
          safe_range: safeRange,
          equipment,
          location_name: locationName,
          temp_log_id: log.id,
        },
      };

      const loggedEvent = await this.logEvent(event);

      // SMS the cook
      if (cook?.phone) {
        const smsBody = outOfRangeSMS(
          locationName,
          equipment,
          temp,
          safeRange,
          cook.name,
          `${BASE_URL}/dashboard/safety`
        );
        await this.notify("critical", { phone: cook.phone, email: cook.email, name: cook.name }, smsBody, undefined, undefined, loggedEvent.id);
      }

      events.push(event);
    }

    return events;
  }

  // ── 3. Check Expiring Certifications ──
  async checkCertifications(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const today = new Date().toISOString().split("T")[0];
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const thirtyDaysStr = thirtyDays.toISOString().split("T")[0];

    const { data: certs } = await this.supabase
      .from("certifications")
      .select("*, employees!inner(name, phone, email, location_id), locations!inner(name, manager_name)")
      .lte("expiry_date", thirtyDaysStr)
      .eq("status", "active")
      .order("expiry_date", { ascending: true });

    if (!certs) return events;

    for (const cert of certs) {
      const employee = cert.employees;
      const location = cert.locations;
      if (!employee) continue;

      const employeeName = employee.name;
      const certName = cert.cert_type || cert.cert_name || "Certification";
      const daysLeft = Math.floor(
        (new Date(cert.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if already alerted within last 7 days
      const { data: existingAlert } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("metadata->>cert_id", cert.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (existingAlert) continue;

      const event: AgentEvent = {
        agent_type: "food_safety",
        event_type: daysLeft <= 0 ? "cert_expired" : "cert_expiring",
        location_id: employee.location_id,
        severity: daysLeft <= 0 ? "critical" : daysLeft <= 7 ? "warning" : "info",
        description: `${employeeName}'s ${certName} ${daysLeft <= 0 ? "EXPIRED" : `expires in ${daysLeft} days`}`,
        action_taken: daysLeft <= 0 ? "Marked as expired, manager notified" : "Notified employee",
        metadata: {
          employee_name: employeeName,
          cert_name: certName,
          expiry_date: cert.expiry_date,
          days_left: daysLeft,
          cert_id: cert.id,
        },
      };

      const loggedEvent = await this.logEvent(event);

      // Notify based on severity
      if (daysLeft <= 0) {
        // Expired — mark cert as expired, notify manager
        await this.supabase.from("certifications").update({ status: "expired" }).eq("id", cert.id);

        if (location?.manager_name) {
          // Get manager contact
          const { data: manager } = await this.supabase
            .from("employees")
            .select("phone, email, name")
            .eq("location_id", employee.location_id)
            .eq("role", "manager")
            .limit(1)
            .single();

          if (manager?.phone) {
            await this.notify(
              "critical",
              { phone: manager.phone, email: manager.email, name: manager.name },
              `🚨 ${employeeName}'s ${certName} has EXPIRED. Remove from food handling duties immediately.\n—Vertex Safety`,
              undefined, undefined, loggedEvent.id
            );
          }
        }
      } else if (daysLeft <= 7 && employee.phone) {
        // Urgent — SMS
        const smsBody = certExpiringSMS(
          employeeName,
          certName,
          cert.expiry_date,
          `${BASE_URL}/dashboard/safety`
        );
        await this.notify("warning", { phone: employee.phone as string, email: employee.email as string, name: employeeName }, smsBody, undefined, undefined, loggedEvent.id);
      } else if (employee.email) {
        // 30-day warning — email
        const html = certWarningHTML(employeeName, certName, cert.expiry_date, daysLeft);
        await this.notify(
          "info",
          { email: employee.email as string, name: employeeName },
          `Your ${certName} expires in ${daysLeft} days`,
          `Certification Expiring — ${employeeName}`,
          html,
          loggedEvent.id
        );
      }

      events.push(event);
    }

    return events;
  }

  // ── 4. Check Overdue Corrective Actions ──
  async checkCorrectiveActions(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: actions } = await this.supabase
      .from("corrective_actions")
      .select("*, locations!inner(name)")
      .eq("status", "open")
      .lte("due_date", oneDayAgo.toISOString().split("T")[0]);

    if (!actions) return events;

    for (const action of actions) {
      const hoursOld = Math.floor((now.getTime() - new Date(action.due_date).getTime()) / (1000 * 60 * 60));
      if (hoursOld < 24) continue; // not overdue yet

      // Check if we already alerted in last 24h
      const { data: existingAlert } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("metadata->>corrective_action_id", action.id)
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (existingAlert) continue;

      const locationName = action.locations?.name || "Unknown Store";

      const event: AgentEvent = {
        agent_type: "food_safety",
        event_type: "corrective_overdue",
        location_id: action.location_id,
        severity: hoursOld >= 48 ? "critical" : "warning",
        description: `⚠️ Overdue corrective action at ${locationName}: ${action.title}`,
        action_taken: `Alerted ${hoursOld >= 48 ? "manager" : "assignee"}`,
        metadata: {
          action_title: action.title,
          action_description: action.trigger_description,
          due_date: action.due_date,
          hours_overdue: hoursOld,
          assigned_to: action.assigned_to,
        },
      };

      const loggedEvent = await this.logEvent(event);

      // Get the assignee or manager
      if (hoursOld >= 48) {
        // Escalate to manager
        const { data: manager } = await this.supabase
          .from("employees")
          .select("phone, email, name")
          .eq("location_id", action.location_id)
          .eq("role", "manager")
          .limit(1)
          .single();

        if (manager?.phone) {
          const smsBody = escalationSMS(
            locationName,
            action.title,
            hoursOld,
            action.assigned_to || "Unknown",
            manager.name,
            `${BASE_URL}/action/${action.id}`
          );
          await this.notify("critical", { phone: manager.phone, email: manager.email, name: manager.name }, smsBody, undefined, undefined, loggedEvent.id);
        }
      } else {
        // Re-alert the assignee
        const { data: assignee } = await this.supabase
          .from("employees")
          .select("phone, email, name")
          .eq("id", action.assigned_to)
          .single();

        if (assignee?.phone) {
          await this.notify(
            "warning",
            { phone: assignee.phone, email: assignee.email, name: assignee.name },
            `⏰ Reminder: Corrective action still open (${hoursOld}h) — ${action.trigger_description} at ${locationName}\n—Vertex Safety`,
            undefined, undefined, loggedEvent.id
          );
        }
      }

      events.push(event);
    }

    return events;
  }
}