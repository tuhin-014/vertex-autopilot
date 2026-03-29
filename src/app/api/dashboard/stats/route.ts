import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Dashboard stats API for auto-refresh polling
export async function GET() {
  const supabase = createServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = todayStart.toISOString();

  const [
    { data: locations },
    { data: events },
    { data: approvals },
    { data: todayNotifs },
    { data: openActions },
  ] = await Promise.all([
    supabase.from("locations").select("id"),
    supabase.from("agent_events").select("id, severity, agent_type, event_type, description, action_taken, location_id, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("approval_queue").select("*").eq("status", "pending"),
    supabase.from("notifications_log").select("id").gte("created_at", today),
    supabase.from("corrective_actions").select("id").eq("status", "open"),
  ]);

  const locationCount = locations?.length ?? 0;
  const criticals = events?.filter(e => e.severity === "critical").length ?? 0;
  const warnings = events?.filter(e => e.severity === "warning").length ?? 0;
  const todayEvents = events?.filter(e => new Date(e.created_at) >= todayStart).length ?? 0;

  return NextResponse.json({
    locationCount,
    criticals,
    warnings,
    healthy: Math.max(0, locationCount - criticals - warnings),
    pendingApprovals: approvals?.length ?? 0,
    todayActions: todayEvents,
    smsSent: todayNotifs?.length ?? 0,
    openCorrectiveActions: openActions?.length ?? 0,
    recentEvents: events ?? [],
    approvals: approvals ?? [],
    lastUpdated: new Date().toISOString(),
  });
}
