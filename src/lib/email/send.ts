const RESEND_KEY = process.env.RESEND_API_KEY!;

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from || "Vertex Autopilot <noreply@vertexlabsolutions.com>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    const data = await res.json();
    if (data.id) return { success: true, id: data.id };
    return { success: false, error: data.message || "Unknown error" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Email failed" };
  }
}

// ── Templates ──

export function dailySummaryHTML(data: {
  storeName: string;
  date: string;
  safetyScore: number;
  alertsSent: number;
  missedLogs: number;
  expiringCerts: number;
  openPositions: number;
  newHires: number;
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: #111827; color: white; padding: 24px; border-radius: 12px;">
    <h1 style="margin: 0 0 4px;">🤖 Vertex Autopilot</h1>
    <p style="color: #9ca3af; margin: 0;">Daily Summary — ${data.date}</p>

    <div style="margin-top: 20px; padding: 16px; background: #1f2937; border-radius: 8px;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">📍 ${data.storeName}</h2>
      <table style="width: 100%; color: #d1d5db; font-size: 14px;">
        <tr><td style="padding: 4px 0;">Safety Score</td><td style="text-align: right; color: ${data.safetyScore >= 90 ? '#34d399' : '#fbbf24'}; font-weight: bold;">${data.safetyScore}/100</td></tr>
        <tr><td style="padding: 4px 0;">Alerts Sent Today</td><td style="text-align: right; font-weight: bold;">${data.alertsSent}</td></tr>
        <tr><td style="padding: 4px 0;">Missed Temp Logs</td><td style="text-align: right; color: ${data.missedLogs > 0 ? '#f87171' : '#34d399'}; font-weight: bold;">${data.missedLogs}</td></tr>
        <tr><td style="padding: 4px 0;">Expiring Certs (30d)</td><td style="text-align: right; color: ${data.expiringCerts > 0 ? '#fbbf24' : '#34d399'}; font-weight: bold;">${data.expiringCerts}</td></tr>
        <tr><td style="padding: 4px 0;">Open Positions</td><td style="text-align: right; font-weight: bold;">${data.openPositions}</td></tr>
        <tr><td style="padding: 4px 0;">New Hires This Week</td><td style="text-align: right; color: #34d399; font-weight: bold;">${data.newHires}</td></tr>
      </table>
    </div>

    <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">Vertex Lab Solutions © 2026</p>
  </div>
</body>
</html>`;
}

export function certWarningHTML(employeeName: string, certType: string, expiryDate: string, daysLeft: number) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #111827; color: white; padding: 24px; border-radius: 12px;">
    <h1 style="margin: 0;">📋 Certification Expiring</h1>
    <div style="margin-top: 16px; padding: 16px; background: #1f2937; border-radius: 8px;">
      <p><strong>${employeeName}</strong> — ${certType}</p>
      <p style="color: ${daysLeft <= 7 ? '#f87171' : '#fbbf24'}; font-weight: bold;">Expires: ${expiryDate} (${daysLeft} days)</p>
      <p style="color: #9ca3af;">Training has been auto-scheduled. Please ensure completion before expiry.</p>
    </div>
    <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">—Vertex Safety Autopilot</p>
  </div>
</body>
</html>`;
}
