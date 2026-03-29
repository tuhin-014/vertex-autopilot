import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Simulate a realistic "day in the life" of Vertex Autopilot
// Seeds the database with a sequence of events that tell a compelling story
export async function GET() {
  const supabase = createServiceClient();
  const now = new Date();
  const results: string[] = [];

  // Get locations
  const { data: locations } = await supabase.from("locations").select("id, name").limit(10);
  if (!locations || locations.length === 0) return NextResponse.json({ error: "No locations. Run /api/seed first." });

  // Get employees
  const { data: employees } = await supabase.from("employees").select("id, name, role, location_id, phone");

  // Helper: create event at a specific time offset (minutes ago)
  async function addEvent(minutesAgo: number, event: Record<string, unknown>) {
    const time = new Date(now.getTime() - minutesAgo * 60 * 1000);
    await supabase.from("agent_events").insert({ ...event, created_at: time.toISOString() });
  }

  // ── MORNING SHIFT (simulate events from past 8 hours) ──

  // 6:15 AM — Missed temp log at Store #5
  const store5 = locations[4] || locations[0];
  const cook5 = employees?.find(e => e.location_id === store5.id && e.role === "cook");
  await addEvent(480, {
    agent_type: "food_safety", event_type: "missed_log", location_id: store5.id, severity: "warning",
    description: `🔴 ${store5.name} — Temp log overdue for Walk-In Cooler (scheduled 06:00)`,
    action_taken: `SMS sent to ${cook5?.name || "cook"}`,
    metadata: { equipment: "Walk-In Cooler", scheduled_time: "06:00" },
  });
  results.push("6:15 AM — Missed temp log at Store #5 → SMS sent");

  // 6:45 AM — Cook responds, logs temp, but it's out of range!
  await addEvent(450, {
    agent_type: "food_safety", event_type: "out_of_range", location_id: store5.id, severity: "critical",
    description: `⚠️ CRITICAL: Walk-In Cooler at ${store5.name} reading 47°F (safe: ≤ 41°F)`,
    action_taken: `Corrective action created, SMS sent to ${cook5?.name || "cook"}`,
    metadata: { temperature: 47, safe_range: "≤ 41°F", equipment: "Walk-In Cooler" },
  });
  results.push("6:45 AM — Out-of-range temp detected → corrective action created");

  // 7:00 AM — Cert scan finds 3 expiring
  const store3 = locations[2] || locations[0];
  await addEvent(420, {
    agent_type: "food_safety", event_type: "cert_expiring", location_id: store3.id, severity: "info",
    description: `📋 Maria Garcia's ServSafe Food Handler expires in 12 days (2026-04-10)`,
    action_taken: "Email sent to employee",
    metadata: { days_left: 12, cert_type: "ServSafe Food Handler" },
  });
  await addEvent(419, {
    agent_type: "food_safety", event_type: "cert_expired", location_id: locations[6]?.id || store3.id, severity: "critical",
    description: `❌ EXPIRED: James Wilson's ServSafe Food Handler expired 5 days ago`,
    action_taken: "Employee flagged as non-compliant, manager notified",
    metadata: { days_left: -5, cert_type: "ServSafe Food Handler" },
  });
  results.push("7:00 AM — Cert scan: 1 expiring (12 days), 1 expired → alerts sent");

  // 8:00 AM — Staffing check: Store #1 understaffed
  const store1 = locations[0];
  await addEvent(360, {
    agent_type: "hiring", event_type: "understaffed", location_id: store1.id, severity: "warning",
    description: `⚠️ ${store1.name} — server understaffed: 1/8 (min: 5)`,
    action_taken: "Job auto-posted: Server / Wait Staff",
    metadata: { role: "server", current_count: 1, target_count: 8, min_count: 5 },
  });
  results.push("8:00 AM — Store #1 understaffed → job auto-posted");

  // 8:30 AM — Revenue optimizer: Sunday brunch prediction
  await addEvent(330, {
    agent_type: "revenue_optimizer", event_type: "day_pattern", location_id: store1.id, severity: "info",
    description: "📅 Today is Sunday — 🔥 High (Sunday brunch rush). Full staff, push brunch specials, ensure pancake batter prepped by 6 AM",
    metadata: { day: "Sunday", day_of_week: 0 },
  });
  results.push("8:30 AM — Revenue optimizer: Sunday brunch rush prediction");

  // 9:00 AM — Weather recommendation
  await addEvent(300, {
    agent_type: "revenue_optimizer", event_type: "weather_recommendation", location_id: store1.id, severity: "info",
    description: "🌧️ Rain forecasted today (8mm). Comfort food sells well — push soup/coffee specials. Delivery orders typically +20%.",
    metadata: { max_temp: 62, precipitation: 8, weather_code: 61 },
  });
  results.push("9:00 AM — Weather: rain → push delivery + comfort food");

  // 9:30 AM — Candidate screened via text-to-apply
  const store2 = locations[1] || locations[0];
  await addEvent(270, {
    agent_type: "hiring", event_type: "candidate_screened", location_id: store2.id, severity: "info",
    description: `✅ Alex Rivera scored 87/100 for Server / Wait Staff — interview invite sent`,
    action_taken: "SMS sent to candidate (+19195551001)",
    metadata: { candidate_name: "Alex Rivera", score: 87 },
  });
  await addEvent(269, {
    agent_type: "hiring", event_type: "candidate_rejected", location_id: store2.id, severity: "log",
    description: `❌ Jordan Lee scored 42/100 for Server / Wait Staff — below threshold`,
    metadata: { candidate_name: "Jordan Lee", score: 42 },
  });
  results.push("9:30 AM — 2 candidates screened: Alex (87) invited, Jordan (42) rejected");

  // 10:00 AM — Corrective action still open from 6:45 AM → escalation
  await addEvent(240, {
    agent_type: "food_safety", event_type: "corrective_overdue", location_id: store5.id, severity: "warning",
    description: `Corrective action overdue (3h): Walk-In Cooler reading 47°F at ${store5.name}`,
    action_taken: `Re-alert sent to ${cook5?.name || "cook"}`,
    metadata: { hours_overdue: 3 },
  });
  results.push("10:00 AM — Corrective action overdue → re-alert sent");

  // 11:00 AM — Spend optimizer: anomaly
  const store8 = locations[7] || locations[0];
  await addEvent(180, {
    agent_type: "spend_optimizer", event_type: "spending_anomaly", location_id: store8.id, severity: "warning",
    description: `📊 ${store8.name} — 5 corrective actions this week (avg: 1.2/wk). Operational issue spike detected.`,
    action_taken: "Alert sent to regional for investigation",
    metadata: { recent_count: 5, weekly_avg: 1.2 },
  });
  results.push("11:00 AM — Spend optimizer: anomaly spike at Store #8");

  // 11:30 AM — Cross-product intelligence: safety ↔ staffing correlation!
  await addEvent(150, {
    agent_type: "cross_product", event_type: "safety_staffing_correlation", location_id: store5.id, severity: "critical",
    description: `🧠 INSIGHT: ${store5.name} has 4 safety issues this week AND is only 60% staffed. These are likely connected — overworked staff miss safety protocols.`,
    action_taken: "Prioritized hiring for this location, safety training auto-scheduled",
    metadata: { safety_events: 4, staffing_pct: 60, correlation: "understaffing → safety_violations" },
  });
  results.push("11:30 AM — CROSS-PRODUCT: safety + staffing correlation detected");

  // 12:00 PM — Training gap
  await addEvent(120, {
    agent_type: "cross_product", event_type: "training_gap", location_id: store3.id, severity: "warning",
    description: `🧠 INSIGHT: ${store3.name} has 4 certifications expiring within 30 days. This indicates a training gap — bulk re-certification should be scheduled.`,
    action_taken: "Recommended group training session, Vertex Train enrollment suggested",
    metadata: { expiring_count: 4 },
  });
  results.push("12:00 PM — Training gap detected at Store #3");

  // 1:00 PM — High-risk store flagged
  await addEvent(60, {
    agent_type: "cross_product", event_type: "high_risk_store", location_id: store5.id, severity: "critical",
    description: `🧠 HIGH RISK: ${store5.name} — Risk Score 22 (safety: 4, staffing: 2, corrective: 3). Multiple operational issues converging.`,
    action_taken: "Store flagged for regional manager review, recommended on-site visit",
    metadata: { risk_score: 22, safety_events: 4, hiring_events: 2, open_corrective: 3 },
  });

  // Create approval for the on-site visit
  await supabase.from("approval_queue").insert({
    agent_type: "cross_product",
    action_type: "on_site_visit",
    location_id: store5.id,
    requested_by: "agent",
    status: "pending",
    payload: { store_name: store5.name, risk_score: 22, reason: "Multi-dimensional risk: 4 safety, 2 staffing, 3 corrective" },
  });
  results.push("1:00 PM — HIGH RISK store flagged → on-site visit approval created");

  // 1:30 PM — Weekly insight report
  await addEvent(30, {
    agent_type: "cross_product", event_type: "weekly_insight_report", location_id: store1.id, severity: "info",
    description: "📊 Weekly Report: 47 total events — Safety: 18, Hiring: 12, Staffing: 5, Revenue: 4, Spend: 3, Cross-Product: 5. Critical: 8, Warning: 15.",
    metadata: { total_events: 47, by_agent: { food_safety: 18, hiring: 12, staffing: 5, revenue_optimizer: 4, spend_optimizer: 3, cross_product: 5 } },
  });
  results.push("1:30 PM — Weekly insight report generated");

  // Also create a hiring approval
  await supabase.from("approval_queue").insert({
    agent_type: "hiring",
    action_type: "hire_decision",
    location_id: store2.id,
    requested_by: "agent",
    status: "pending",
    payload: { candidate_name: "Alex Rivera", role: "server", ai_score: 87, interview_date: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString() },
  });

  await supabase.from("approval_queue").insert({
    agent_type: "hiring",
    action_type: "hire_decision",
    location_id: store1.id,
    requested_by: "agent",
    status: "pending",
    payload: { candidate_name: "Priya Patel", role: "cook", ai_score: 92, interview_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() },
  });
  results.push("+ 2 hire decision approvals + 1 on-site visit approval created");

  return NextResponse.json({
    success: true,
    message: "Demo simulation complete — realistic day-in-the-life events seeded",
    events_created: results.length,
    timeline: results,
  });
}
