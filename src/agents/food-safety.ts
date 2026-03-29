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
        windowEnd.setMinutes(windowEnd.getMinutes() + graceMins);

        // Only check today's logs
        if (windowStart.getDate() !== now.getDate()) continue;

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
            .eq("agent_type", "food_safety")
            .eq("event_type", "missed_log")
            .eq("location_id", schedule.location_id)
            .gte("created_at", windowStart.toISOString())
            .single();

          if (existingAlert) continue; // Already alerted

          const locationName = (schedule as Record<string, unknown>).locations
            ? ((schedule as Record<string, unknown>).locations as Record<string, string>).name
            : "Unknown Store";

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

          const eventId = await this.logEvent(event);

          // Send SMS to cook
          if (cook?.phone) {
            const smsBody = missedLogSMS(
              locationName,
              schedule.equipment_name,
              cook.name,
              `${BASE_URL}/dashboard/safety`
            );
            await this.notify("warning", { phone: cook.phone, email: cook.email, name: cook.name }, smsBody, undefined, undefined, eventId);
          }

          events.push(event);
        }
      }
    }

    return events;
  }

  // ── 2. Check Out-of-Range Temps ──
  async checkOutOfRange(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get temp logs from the last hour that haven't been flagged
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentLogs } = await this.supabase
      .from("temp_logs")
      .select("*, locations!inner(id, name)")
      .gte("recorded_at", oneHourAgo)
      .or("status.is.null,status.neq.flagged");

    if (!recentLogs) return events;

    for (const log of recentLogs) {
      const temp = Number(log.temperature);
      const equipment = log.equipment || "";
      const isCold = equipment.toLowerCase().includes("cooler") || equipment.toLowerCase().includes("freezer");
      const isHot = equipment.toLowerCase().includes("hot") || equipment.toLowerCase().includes("grill");

      let violation = false;
      let safeRange = "";

      if (isCold && temp > COLD_MAX) {
        violation = true;
        safeRange = `≤ ${COLD_MAX}°F`;
      } else if (isHot && temp < HOT_MIN) {
        violation = true;
        safeRange = `≥ ${HOT_MIN}°F`;
      }

      if (!violation) continue;

      // Check if already flagged
      const { data: existingFlag } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "out_of_range")
        .eq("location_id", log.location_id)
        .eq("metadata->>temp_log_id", log.id)
        .single();

      if (existingFlag) continue;

      const locationName = (log as Record<string, unknown>).locations
        ? ((log as Record<string, unknown>).locations as Record<string, string>).name
        : "Unknown Store";

      // Get cook at location
      const { data: cook } = await this.supabase
        .from("employees")
        .select("id, name, phone, email")
        .eq("location_id", log.location_id)
        .eq("role", "cook")
        .limit(1)
        .single();

      // Create corrective action
      const { data: corrective } = await this.supabase
        .from("corrective_actions")
        .insert({
          organization_id: log.organization_id,
          location_id: log.location_id,
          temp_log_id: log.id,
          trigger_type: "out_of_range",
          trigger_description: `${equipment} reading ${temp}°F (safe: ${safeRange})`,
          equipment: equipment,
          temperature: temp,
          action_steps: [
            { step: 1, action: "Check equipment immediately", done: false },
            { step: 2, action: "Move food to safe storage if needed", done: false },
            { step: 3, action: "Re-check temp in 15 minutes", done: false },
            { step: 4, action: "Report to manager if not resolved", done: false },
          ],
          status: "open",
          assigned_to: cook?.name || "Unassigned",
        })
        .select("id")
        .single();

      // Mark temp log as flagged
      await this.supabase
        .from("temp_logs")
        .update({ status: "flagged" })
        .eq("id", log.id);

      const event: AgentEvent = {
        agent_type: "food_safety",
        event_type: "out_of_range",
        location_id: log.location_id,
        severity: "critical",
        description: `⚠️ ${equipment} at ${locationName}: ${temp}°F (safe: ${safeRange})`,
        action_taken: `Corrective action created, SMS sent to ${cook?.name || "manager"}`,
        metadata: {
          temp_log_id: log.id,
          corrective_action_id: corrective?.id,
          temperature: temp,
          safe_range: safeRange,
          equipment,
        },
      };

      const eventId = await this.logEvent(event);

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
        await this.notify("critical", { phone: cook.phone, email: cook.email, name: cook.name }, smsBody, undefined, undefined, eventId);
      }

      events.push(event);
    }

    return events;
  }

  // ── 3. Check Expiring Certifications ──
  async checkCertifications(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const now = new Date();
    const thirtyDays = new Date(now);
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const sevenDays = new Date(now);
    sevenDays.setDate(sevenDays.getDate() + 7);

    // Get certs expiring within 30 days or already expired
    const { data: certs } = await this.supabase
      .from("certifications")
      .select("*, employees!inner(id, name, phone, email, location_id, role)")
      .lte("expiry_date", thirtyDays.toISOString().split("T")[0])
      .or("status.is.null,status.neq.revoked");

    if (!certs) return events;

    for (const cert of certs) {
      const expiryDate = new Date(cert.expiry_date);
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const employee = cert.employees as Record<string, string>;
      const employeeName = employee?.name || "Unknown";

      // Check if we already alerted for this cert this week
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: existingAlert } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", daysLeft <= 0 ? "cert_expired" : "cert_expiring")
        .eq("metadata->>cert_id", cert.id)
        .gte("created_at", weekAgo.toISOString())
        .single();

      if (existingAlert) continue;

      let severity: Severity = "info";
      let eventType = "cert_expiring";

      if (daysLeft <= 0) {
        severity = "critical";
        eventType = "cert_expired";
      } else if (daysLeft <= 7) {
        severity = "warning";
      }

      // Get location name
      const { data: location } = await this.supabase
        .from("locations")
        .select("name, manager_name")
        .eq("id", employee.location_id)
        .single();

      const event: AgentEvent = {
        agent_type: "food_safety",
        event_type: eventType,
        location_id: employee.location_id,
        severity,
        description: daysLeft <= 0
          ? `❌ EXPIRED: ${employeeName}'s ${cert.cert_type || cert.cert_name} expired ${Math.abs(daysLeft)} days ago`
          : `📋 ${employeeName}'s ${cert.cert_type || cert.cert_name} expires in ${daysLeft} days (${cert.expiry_date})`,
        action_taken: daysLeft <= 0
          ? `Employee flagged as non-compliant, manager notified`
          : `${daysLeft <= 7 ? "SMS" : "Email"} sent to employee`,
        metadata: {
          cert_id: cert.id,
          employee_id: employee.id,
          days_left: daysLeft,
          expiry_date: cert.expiry_date,
        },
      };

      const eventId = await this.logEvent(event);

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
              `🚨 ${employeeName}'s ${cert.cert_type || cert.cert_name} has EXPIRED. Remove from food handling duties immediately.\n—Vertex Safety`,
              undefined, undefined, eventId
            );
          }
        }
      } else if (daysLeft <= 7 && employee.phone) {
        // Urgent — SMS
        const smsBody = certExpiringSMS(
          employeeName,
          cert.cert_type || cert.cert_name || "Certification",
          cert.expiry_date,
          `${BASE_URL}/dashboard/safety`
        );
        await this.notify("warning", { phone: employee.phone as string, email: employee.email as string, name: employeeName }, smsBody, undefined, undefined, eventId);
      } else if (employee.email) {
        // 30-day warning — email
        const html = certWarningHTML(employeeName, cert.cert_type || cert.cert_name || "Certification", cert.expiry_date, daysLeft);
        await this.notify(
          "info",
          { email: employee.email as string, name: employeeName },
          `Your ${cert.cert_type || cert.cert_name} expires in ${daysLeft} days`,
          `Certification Expiring — ${employeeName}`,
          html,
          eventId
        );
      }

      events.push(event);
    }

    return events;
  }

  // ── 4. Check Overdue Corrective Actions ──
  async checkCorrectiveActions(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get open corrective actions older than 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    const { data: overdueActions } = await this.supabase
      .from("corrective_actions")
      .select("*, locations!inner(id, name)")
      .eq("status", "open")
      .lte("created_at", fourHoursAgo);

    if (!overdueActions) return events;

    for (const action of overdueActions) {
      const hoursOld = Math.round((Date.now() - new Date(action.created_at).getTime()) / (1000 * 60 * 60));

      // Check if we already escalated this one in the last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recentEscalation } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "corrective_overdue")
        .eq("metadata->>corrective_id", action.id)
        .gte("created_at", twoHoursAgo)
        .single();

      if (recentEscalation) continue;

      const locationName = (action as Record<string, unknown>).locations
        ? ((action as Record<string, unknown>).locations as Record<string, string>).name
        : "Unknown Store";

      const event: AgentEvent = {
        agent_type: "food_safety",
        event_type: "corrective_overdue",
        location_id: action.location_id,
        severity: hoursOld >= 48 ? "critical" : "warning",
        description: `Corrective action overdue (${hoursOld}h): ${action.trigger_description} at ${locationName}`,
        action_taken: hoursOld >= 48 ? "Escalated to regional manager" : `Re-alert sent to ${action.assigned_to}`,
        metadata: {
          corrective_id: action.id,
          hours_overdue: hoursOld,
          assigned_to: action.assigned_to,
        },
      };

      const eventId = await this.logEvent(event);

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
            action.trigger_description,
            hoursOld,
            action.assigned_to,
            manager.name,
            `${BASE_URL}/dashboard/safety`
          );
          await this.notify("critical", { phone: manager.phone, email: manager.email, name: manager.name }, smsBody, undefined, undefined, eventId);
        }
      } else {
        // Re-alert the assignee
        const { data: assignee } = await this.supabase
          .from("employees")
          .select("phone, email, name")
          .eq("name", action.assigned_to)
          .limit(1)
          .single();

        if (assignee?.phone) {
          await this.notify(
            "warning",
            { phone: assignee.phone, email: assignee.email, name: assignee.name },
            `⏰ Reminder: Corrective action still open (${hoursOld}h) — ${action.trigger_description} at ${locationName}\n—Vertex Safety`,
            undefined, undefined, eventId
          );
        }
      }

      events.push(event);
    }

    return events;
  }

  // ── 5. Pattern Detection ──
  async detectPatterns(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get all locations
    const { data: locations } = await this.supabase.from("locations").select("id, name");
    if (!locations) return events;

    for (const location of locations) {
      // Count violations by type in last 30 days
      const { data: violations } = await this.supabase
        .from("agent_events")
        .select("event_type, metadata")
        .eq("agent_type", "food_safety")
        .eq("location_id", location.id)
        .in("severity", ["critical", "warning"])
        .gte("created_at", thirtyDaysAgo);

      if (!violations || violations.length < 3) continue;

      // Group by event_type
      const counts: Record<string, number> = {};
      for (const v of violations) {
        counts[v.event_type] = (counts[v.event_type] || 0) + 1;
      }

      for (const [type, count] of Object.entries(counts)) {
        if (count < 3) continue;

        // Check if we already flagged this pattern this week
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: existing } = await this.supabase
          .from("agent_events")
          .select("id")
          .eq("event_type", "pattern_detected")
          .eq("location_id", location.id)
          .eq("metadata->>pattern_type", type)
          .gte("created_at", weekAgo)
          .single();

        if (existing) continue;

        const event: AgentEvent = {
          agent_type: "food_safety",
          event_type: "pattern_detected",
          location_id: location.id,
          severity: "critical",
          description: `🔄 Pattern: ${count} ${type.replace(/_/g, " ")} violations at ${location.name} in 30 days`,
          action_taken: "Risk alert generated, targeted training recommended",
          metadata: {
            pattern_type: type,
            violation_count: count,
            period_days: 30,
          },
        };

        await this.logEvent(event);

        // Notify store manager
        const { data: manager } = await this.supabase
          .from("employees")
          .select("phone, email, name")
          .eq("location_id", location.id)
          .eq("role", "manager")
          .limit(1)
          .single();

        if (manager?.phone) {
          await this.notify(
            "critical",
            { phone: manager.phone, email: manager.email, name: manager.name },
            `🔄 PATTERN ALERT: ${location.name} has ${count} ${type.replace(/_/g, " ")} incidents in 30 days. Targeted training recommended.\n—Vertex Safety`,
          );
        }

        events.push(event);
      }
    }

    return events;
  }
}
