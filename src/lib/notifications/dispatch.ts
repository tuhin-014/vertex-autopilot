import { createClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/sms/twilio";
import { sendEmail } from "@/lib/email/send";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Severity = "critical" | "warning" | "info" | "log";

interface NotifyOptions {
  locationId: string;
  severity: Severity;
  smsBody: string;
  emailSubject?: string;
  emailHtml?: string;
  agentEventId?: string;
}

/**
 * Smart notification dispatcher — reads preferences before sending.
 * Only sends to contacts who have opted in for the given severity level.
 */
export async function dispatchNotification(options: NotifyOptions): Promise<{ sms: number; email: number }> {
  const { locationId, severity, smsBody, emailSubject, emailHtml, agentEventId } = options;
  let smsSent = 0;
  let emailSent = 0;

  // Get notification preferences for this location
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("location_id", locationId);

  if (!prefs || prefs.length === 0) {
    // Fallback: get manager from employees table
    const { data: manager } = await supabase
      .from("employees")
      .select("phone, email, name")
      .eq("location_id", locationId)
      .eq("role", "manager")
      .limit(1)
      .single();

    if (manager?.phone && (severity === "critical" || severity === "warning")) {
      await sendSMS(manager.phone, smsBody);
      smsSent++;
      await logNotification(manager.phone, null, "sms", smsBody, agentEventId);
    }
    if (manager?.email && emailHtml && severity === "critical") {
      await sendEmail({ to: manager.email, subject: emailSubject || "Vertex Autopilot Alert", html: emailHtml });
      emailSent++;
      await logNotification(null, manager.email, "email", smsBody, agentEventId);
    }
    return { sms: smsSent, email: emailSent };
  }

  // Check each contact's preferences
  for (const pref of prefs) {
    const shouldNotify =
      (severity === "critical" && pref.receive_critical) ||
      (severity === "warning" && pref.receive_warning) ||
      (severity === "info" && pref.receive_info);

    if (!shouldNotify) continue;

    // SMS for critical and warning
    if (pref.phone && (severity === "critical" || severity === "warning")) {
      await sendSMS(pref.phone, smsBody);
      smsSent++;
      await logNotification(pref.phone, null, "sms", smsBody, agentEventId);
    }

    // Email for critical and info (with HTML)
    if (pref.email && emailHtml && (severity === "critical" || severity === "info")) {
      await sendEmail({
        to: pref.email,
        subject: emailSubject || "Vertex Autopilot Alert",
        html: emailHtml,
      });
      emailSent++;
      await logNotification(null, pref.email, "email", smsBody, agentEventId);
    }
  }

  return { sms: smsSent, email: emailSent };
}

async function logNotification(
  phone: string | null,
  email: string | null,
  channel: string,
  message: string,
  agentEventId?: string
) {
  await supabase.from("notifications_log").insert({
    recipient_phone: phone,
    recipient_email: email,
    channel,
    template: "agent_alert",
    message: message.slice(0, 500),
    agent_event_id: agentEventId,
  });
}

/**
 * Get daily summary recipients for a location
 */
export async function getDailySummaryRecipients(locationId?: string): Promise<{ email: string; name: string }[]> {
  let query = supabase
    .from("notification_preferences")
    .select("email, contact_name")
    .eq("receive_daily_summary", true)
    .not("email", "is", null);

  if (locationId) query = query.eq("location_id", locationId);

  const { data } = await query;
  return (data || []).map(p => ({ email: p.email, name: p.contact_name }));
}
