import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Generate a print-friendly HTML regional report (print to PDF from browser)
export async function GET() {
  const supabase = createServiceClient();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all data
  const [
    { data: locations },
    { data: events },
    { data: employees },
    { data: targets },
    { data: openActions },
    { data: expiringCerts },
    { data: jobs },
    { data: candidates },
  ] = await Promise.all([
    supabase.from("locations").select("id, name, last_inspection_score").order("name"),
    supabase.from("agent_events").select("*").gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }),
    supabase.from("employees").select("location_id, role"),
    supabase.from("staffing_targets").select("location_id, role, target_count"),
    supabase.from("corrective_actions").select("location_id").eq("status", "open"),
    supabase.from("certifications").select("employee_id, expiry_date").lte("expiry_date", new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
    supabase.from("job_postings").select("location_id").eq("status", "open"),
    supabase.from("candidates_pipeline").select("stage"),
  ]);

  const totalEvents = events?.length || 0;
  const criticals = events?.filter(e => e.severity === "critical").length || 0;
  const warnings = events?.filter(e => e.severity === "warning").length || 0;
  const expiredCount = expiringCerts?.filter(c => new Date(c.expiry_date) < now).length || 0;
  const expiringCount = (expiringCerts?.length || 0) - expiredCount;

  // Build store rows
  const storeRows = locations?.map(loc => {
    const locTargets = targets?.filter(t => t.location_id === loc.id) || [];
    const locEmps = employees?.filter(e => e.location_id === loc.id) || [];
    let totalTarget = 0, totalActual = 0;
    for (const t of locTargets) {
      totalTarget += t.target_count;
      totalActual += locEmps.filter(e => e.role === t.role).length;
    }
    const staffPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 100;
    const locEvents = events?.filter(e => e.location_id === loc.id) || [];
    const locCriticals = locEvents.filter(e => e.severity === "critical").length;
    const locCorrectiveCount = openActions?.filter(a => a.location_id === loc.id).length || 0;
    const locJobs = jobs?.filter(j => j.location_id === loc.id).length || 0;
    const score = loc.last_inspection_score || 92;

    return `<tr>
      <td>${loc.name}</td>
      <td style="text-align:center;color:${score >= 90 ? '#16a34a' : score >= 80 ? '#ca8a04' : '#dc2626'};font-weight:700;">${score}</td>
      <td style="text-align:center;color:${staffPct >= 100 ? '#16a34a' : staffPct >= 70 ? '#ca8a04' : '#dc2626'}">${staffPct}%</td>
      <td style="text-align:center;color:${locCriticals > 0 ? '#dc2626' : '#16a34a'}">${locCriticals}</td>
      <td style="text-align:center;">${locCorrectiveCount}</td>
      <td style="text-align:center;">${locJobs}</td>
      <td style="text-align:center;">${locEvents.length}</td>
    </tr>`;
  }).join("") || "";

  // Top events
  const topEvents = events?.slice(0, 15).map(e => {
    const icon = e.severity === "critical" ? "🔴" : e.severity === "warning" ? "🟡" : "🟢";
    const time = new Date(e.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    return `<tr><td>${icon}</td><td>${e.agent_type}</td><td>${e.description}</td><td style="white-space:nowrap;">${time}</td></tr>`;
  }).join("") || "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Vertex Autopilot — Regional Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; padding: 40px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 16px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { text-align: center; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .stat .num { font-size: 28px; font-weight: 800; }
  .stat .label { font-size: 11px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  th { background: #1e293b; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:hover { background: #f8fafc; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px;">
    <button onclick="window.print()" style="background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;">📄 Print / Save as PDF</button>
    <a href="/dashboard" style="margin-left:12px;color:#2563eb;text-decoration:none;">← Back to Dashboard</a>
  </div>

  <h1>🤖 Vertex Autopilot — Regional Report</h1>
  <div class="subtitle">IHOP Southeast Region · ${locations?.length || 0} Stores · ${dateStr}</div>

  <div class="stats">
    <div class="stat"><div class="num" style="color:#dc2626;">${criticals}</div><div class="label">Critical</div></div>
    <div class="stat"><div class="num" style="color:#ca8a04;">${warnings}</div><div class="label">Warnings</div></div>
    <div class="stat"><div class="num" style="color:#2563eb;">${totalEvents}</div><div class="label">Total Events</div></div>
    <div class="stat"><div class="num" style="color:#dc2626;">${expiredCount}</div><div class="label">Expired Certs</div></div>
    <div class="stat"><div class="num" style="color:#ca8a04;">${expiringCount}</div><div class="label">Expiring Certs</div></div>
    <div class="stat"><div class="num" style="color:#7c3aed;">${openActions?.length || 0}</div><div class="label">Open Corrective</div></div>
  </div>

  <h2>📍 Store Overview</h2>
  <table>
    <tr><th>Store</th><th style="text-align:center;">Safety</th><th style="text-align:center;">Staffing</th><th style="text-align:center;">Critical</th><th style="text-align:center;">Corrective</th><th style="text-align:center;">Open Jobs</th><th style="text-align:center;">Events</th></tr>
    ${storeRows}
  </table>

  <h2>📋 Recent Agent Activity (Top 15)</h2>
  <table>
    <tr><th style="width:30px;"></th><th>Agent</th><th>Description</th><th>Time</th></tr>
    ${topEvents}
  </table>

  <h2>📊 Hiring Pipeline</h2>
  <table>
    <tr><th>Stage</th><th style="text-align:center;">Count</th></tr>
    <tr><td>Applied</td><td style="text-align:center;">${candidates?.filter(c => c.stage === "applied").length || 0}</td></tr>
    <tr><td>Screened</td><td style="text-align:center;">${candidates?.filter(c => c.stage === "screened").length || 0}</td></tr>
    <tr><td>Interviewing</td><td style="text-align:center;">${candidates?.filter(c => c.stage === "interviewing").length || 0}</td></tr>
    <tr><td>Offered</td><td style="text-align:center;">${candidates?.filter(c => c.stage === "offered").length || 0}</td></tr>
    <tr><td>Hired / Onboarding</td><td style="text-align:center;">${candidates?.filter(c => c.stage === "hired" || c.stage === "onboarding").length || 0}</td></tr>
  </table>

  <div class="footer">
    <p><strong>Vertex Autopilot</strong> · Generated ${new Date().toLocaleString()} · Vertex Lab Solutions © 2026</p>
    <p>Dashboard: vertex-autopilot.vercel.app · Contact: sales@vertexlabsolutions.com</p>
  </div>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
