const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER || "+14788007647";

export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
    });
    const data = await res.json();
    if (data.sid) return { success: true, sid: data.sid };
    return { success: false, error: data.message || "Unknown error" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "SMS failed" };
  }
}

// ── Templates ──

export function missedLogSMS(storeName: string, equipment: string, employeeName: string, link: string) {
  return `🔴 ${storeName} — Temp log overdue for ${equipment}.\nAssigned to: ${employeeName}\nLog now: ${link}\n—Vertex Safety`;
}

export function outOfRangeSMS(storeName: string, equipment: string, temp: number, safeRange: string, employeeName: string, link: string) {
  return `⚠️ CRITICAL: ${equipment} at ${storeName} reading ${temp}°F (safe: ${safeRange}).\nCorrective action created → ${link}\nAssigned to: ${employeeName}\n—Vertex Safety`;
}

export function certExpiringSMS(employeeName: string, certType: string, expiryDate: string, link: string) {
  return `📋 ${employeeName} — Your ${certType} expires ${expiryDate}.\nTraining auto-scheduled: ${link}\n—Vertex Safety`;
}

export function escalationSMS(storeName: string, issue: string, hours: number, employeeName: string, managerName: string, link: string) {
  return `🚨 ${storeName} — ${issue} unresolved for ${hours} hours.\n${employeeName} has not responded.\nAction needed: ${link}\n—Vertex Safety (escalation to ${managerName})`;
}

export function interviewInviteSMS(candidateName: string, position: string, storeName: string, link: string) {
  return `Great news, ${candidateName}! We'd love to interview you for the ${position} position at ${storeName}.\nPick a time: ${link}\n—Vertex Hire`;
}

export function understaffingAlertSMS(storeName: string, role: string, current: number, target: number) {
  return `⚠️ ${storeName} — ${role} understaffed: ${current}/${target}.\nJob auto-posted. Review candidates: [dashboard]\n—Vertex Hire`;
}
