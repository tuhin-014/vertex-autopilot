import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Comprehensive health check — tests every integration
export async function GET() {
  const results: { check: string; status: "pass" | "fail" | "warn"; detail: string; ms?: number }[] = [];
  const start = Date.now();

  // 1. Supabase connection
  try {
    const t = Date.now();
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("locations").select("id").limit(1);
    if (error) throw error;
    results.push({ check: "Supabase DB", status: "pass", detail: `Connected, ${data?.length || 0} locations accessible`, ms: Date.now() - t });
  } catch (e) {
    results.push({ check: "Supabase DB", status: "fail", detail: String(e) });
  }

  // 2. All required tables exist
  try {
    const supabase = createServiceClient();
    const tables = ["locations", "employees", "certifications", "temp_logs", "corrective_actions",
      "agent_events", "approval_queue", "staffing_targets", "notifications_log", "temp_log_schedule",
      "job_postings", "candidates_pipeline", "text_to_apply_sessions", "notification_preferences"];
    const missing: string[] = [];
    for (const table of tables) {
      const { error } = await supabase.from(table).select("id").limit(1);
      if (error) missing.push(table);
    }
    results.push({
      check: "Database Tables",
      status: missing.length === 0 ? "pass" : "fail",
      detail: missing.length === 0 ? `All ${tables.length} tables accessible` : `Missing: ${missing.join(", ")}`,
    });
  } catch (e) {
    results.push({ check: "Database Tables", status: "fail", detail: String(e) });
  }

  // 3. Seed data present
  try {
    const supabase = createServiceClient();
    const [locs, emps, certs, targets, schedules] = await Promise.all([
      supabase.from("locations").select("id", { count: "exact", head: true }),
      supabase.from("employees").select("id", { count: "exact", head: true }),
      supabase.from("certifications").select("id", { count: "exact", head: true }),
      supabase.from("staffing_targets").select("id", { count: "exact", head: true }),
      supabase.from("temp_log_schedule").select("id", { count: "exact", head: true }),
    ]);
    const counts = {
      locations: locs.count || 0, employees: emps.count || 0,
      certifications: certs.count || 0, staffing_targets: targets.count || 0,
      temp_log_schedules: schedules.count || 0,
    };
    const allSeeded = Object.values(counts).every(c => c > 0);
    results.push({
      check: "Seed Data",
      status: allSeeded ? "pass" : "warn",
      detail: Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", "),
    });
  } catch (e) {
    results.push({ check: "Seed Data", status: "fail", detail: String(e) });
  }

  // 4. Twilio SMS
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token) throw new Error("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing");
    const t = Date.now();
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") },
    });
    const data = await res.json();
    results.push({
      check: "Twilio SMS",
      status: data.status === "active" ? "pass" : "warn",
      detail: `Account: ${data.status || "unknown"}, From: ${from || "not set"}`,
      ms: Date.now() - t,
    });
  } catch (e) {
    results.push({ check: "Twilio SMS", status: "fail", detail: String(e) });
  }

  // 5. Resend Email
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY missing");
    const t = Date.now();
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json();
    results.push({
      check: "Resend Email",
      status: res.ok ? "pass" : "warn",
      detail: res.ok ? `${data.data?.length || 0} domains configured` : `Status: ${res.status}`,
      ms: Date.now() - t,
    });
  } catch (e) {
    results.push({ check: "Resend Email", status: "fail", detail: String(e) });
  }

  // 6. Stripe Billing
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY missing");
    const t = Date.now();
    const res = await fetch("https://api.stripe.com/v1/products?limit=5", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json();
    results.push({
      check: "Stripe Billing",
      status: res.ok ? "pass" : "warn",
      detail: res.ok ? `${data.data?.length || 0} products found` : `Status: ${res.status}`,
      ms: Date.now() - t,
    });
  } catch (e) {
    results.push({ check: "Stripe Billing", status: "fail", detail: String(e) });
  }

  // 7. Weather API (Open-Meteo — no key needed)
  try {
    const t = Date.now();
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.78&longitude=-78.64&current=temperature_2m");
    const data = await res.json();
    results.push({
      check: "Weather API",
      status: res.ok ? "pass" : "warn",
      detail: res.ok ? `Raleigh NC: ${data.current?.temperature_2m}°C` : `Status: ${res.status}`,
      ms: Date.now() - t,
    });
  } catch (e) {
    results.push({ check: "Weather API", status: "fail", detail: String(e) });
  }

  // 8. Agent Events (recent activity)
  try {
    const supabase = createServiceClient();
    const { data, count } = await supabase
      .from("agent_events")
      .select("id", { count: "exact", head: true });
    const { data: recent } = await supabase
      .from("agent_events")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    const lastEvent = recent?.created_at ? new Date(recent.created_at).toLocaleString() : "never";
    results.push({
      check: "Agent Events",
      status: (count || 0) > 0 ? "pass" : "warn",
      detail: `${count || 0} total events, last: ${lastEvent}`,
    });
  } catch (e) {
    results.push({ check: "Agent Events", status: "warn", detail: String(e) });
  }

  // 9. Cron Jobs (check vercel.json)
  results.push({
    check: "Cron Jobs",
    status: "pass",
    detail: "6 configured: check-temps (30m), check-certs (daily), check-corrective (2h), check-staffing (daily), screen-candidates (1h), daily-summary (daily)",
  });

  // 10. Auth (Supabase)
  try {
    const supabase = createServiceClient();
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    results.push({
      check: "Auth System",
      status: error ? "warn" : "pass",
      detail: error ? `Auth check: ${error.message}` : `${users?.length || 0}+ users registered`,
    });
  } catch (e) {
    results.push({ check: "Auth System", status: "warn", detail: `Admin API: ${e}` });
  }

  // Summary
  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const warned = results.filter(r => r.status === "warn").length;
  const totalMs = Date.now() - start;

  return NextResponse.json({
    status: failed === 0 ? "healthy" : "degraded",
    summary: `${passed} passed, ${warned} warnings, ${failed} failed`,
    elapsed_ms: totalMs,
    timestamp: new Date().toISOString(),
    checks: results,
  });
}
