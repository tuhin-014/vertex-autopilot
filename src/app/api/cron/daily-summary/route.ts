import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail, dailySummaryHTML } from "@/lib/email/send";

// Vercel Cron: daily at 9 PM EST (02:00 UTC next day)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = todayStart.toISOString();
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Get all locations
  const { data: locations } = await supabase.from("locations").select("id, name, last_inspection_score");
  if (!locations) return NextResponse.json({ error: "No locations" });

  // Today's events
  const { data: events } = await supabase.from("agent_events").select("*").gte("created_at", today);
  
  // Today's notifications
  const { data: notifs } = await supabase.from("notifications_log").select("*").gte("created_at", today);

  // Expiring certs
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const { data: expiringCerts } = await supabase.from("certifications").select("employee_id").lte("expiry_date", thirtyDays.toISOString().split("T")[0]);

  // Open corrective
  const { data: openActions } = await supabase.from("corrective_actions").select("id").eq("status", "open");

  // Open jobs
  const { data: openJobs } = await supabase.from("job_postings").select("id").eq("status", "open");

  // Build summary email
  const totalAlerts = events?.length || 0;
  const smsSent = notifs?.filter((n) => n.channel?.includes("sms")).length || 0;
  const missedLogs = events?.filter((e) => e.event_type === "missed_log").length || 0;

  const summaryHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: #111827; color: white; padding: 32px; border-radius: 16px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 32px;">🤖</span>
      <h1 style="margin: 8px 0 4px; font-size: 24px;">Vertex Autopilot</h1>
      <p style="color: #9ca3af; margin: 0; font-size: 14px;">Daily Summary — ${dateStr}</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      <div style="background: #1f2937; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 28px; font-weight: bold; color: #60a5fa;">${totalAlerts}</div>
        <div style="font-size: 12px; color: #9ca3af;">Alerts Today</div>
      </div>
      <div style="background: #1f2937; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 28px; font-weight: bold; color: #34d399;">${smsSent}</div>
        <div style="font-size: 12px; color: #9ca3af;">SMS Sent</div>
      </div>
      <div style="background: #1f2937; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 28px; font-weight: bold; color: ${missedLogs > 0 ? '#fbbf24' : '#34d399'};">${missedLogs}</div>
        <div style="font-size: 12px; color: #9ca3af;">Missed Logs</div>
      </div>
      <div style="background: #1f2937; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 28px; font-weight: bold; color: ${(expiringCerts?.length || 0) > 0 ? '#fbbf24' : '#34d399'};">${expiringCerts?.length || 0}</div>
        <div style="font-size: 12px; color: #9ca3af;">Certs Expiring</div>
      </div>
    </div>

    <div style="background: #1f2937; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #d1d5db;">Operations</h3>
      <table style="width: 100%; font-size: 13px; color: #9ca3af;">
        <tr><td>Open Corrective Actions</td><td style="text-align: right; font-weight: bold; color: ${(openActions?.length || 0) > 0 ? '#f87171' : '#34d399'};">${openActions?.length || 0}</td></tr>
        <tr><td>Open Job Postings</td><td style="text-align: right; font-weight: bold; color: #60a5fa;">${openJobs?.length || 0}</td></tr>
        <tr><td>Total Stores Monitored</td><td style="text-align: right; font-weight: bold; color: #d1d5db;">${locations.length}</td></tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="https://vertex-autopilot.vercel.app/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Dashboard</a>
    </div>

    <p style="color: #6b7280; font-size: 11px; text-align: center; margin-top: 24px;">
      Vertex Lab Solutions © 2026 • Vertex Autopilot Regional Summary
    </p>
  </div>
</body>
</html>`;

  // Send to regional manager email (configurable)
  const recipientEmail = process.env.REGIONAL_MANAGER_EMAIL || "tuhin014@gmail.com";
  const result = await sendEmail({
    to: recipientEmail,
    subject: `🤖 Vertex Autopilot Daily Summary — ${dateStr}`,
    html: summaryHtml,
  });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    email_sent: result.success,
    email_id: result.id,
    summary: { totalAlerts, smsSent, missedLogs, expiringCerts: expiringCerts?.length || 0, openActions: openActions?.length || 0, openJobs: openJobs?.length || 0 },
  });
}
