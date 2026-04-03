import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const days = parseInt(searchParams.get("days") || "30");

  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  let query = supabase
    .from("checklist_completions")
    .select("*, checklist_templates:template_id(name, type)")
    .gte("shift_date", since)
    .order("shift_date", { ascending: false });

  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const completions = data || [];

  // Compliance rate by shift type
  const compliance: Record<string, { total: number; completed: number; rate: number }> = {};
  for (const c of completions) {
    const type = c.shift_type;
    if (!compliance[type]) compliance[type] = { total: 0, completed: 0, rate: 0 };
    compliance[type].total++;
    if (c.status === "completed") compliance[type].completed++;
  }
  for (const type of Object.keys(compliance)) {
    compliance[type].rate = compliance[type].total > 0
      ? Math.round((compliance[type].completed / compliance[type].total) * 100)
      : 0;
  }

  // By employee
  const byEmployee: Record<string, { completed: number; incomplete: number; avgPct: number }> = {};
  for (const c of completions) {
    const emp = c.completed_by;
    if (!byEmployee[emp]) byEmployee[emp] = { completed: 0, incomplete: 0, avgPct: 0 };
    if (c.status === "completed") byEmployee[emp].completed++;
    else byEmployee[emp].incomplete++;
  }
  for (const emp of Object.keys(byEmployee)) {
    const e = byEmployee[emp];
    const total = e.completed + e.incomplete;
    e.avgPct = total > 0 ? Math.round((e.completed / total) * 100) : 0;
  }

  return NextResponse.json({
    completions,
    compliance,
    by_employee: byEmployee,
    summary: {
      total: completions.length,
      completed: completions.filter((c) => c.status === "completed").length,
      in_progress: completions.filter((c) => c.status === "in_progress").length,
      incomplete: completions.filter((c) => c.status === "incomplete").length,
    },
  });
}
