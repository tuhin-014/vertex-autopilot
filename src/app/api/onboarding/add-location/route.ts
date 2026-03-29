import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { orgId, name, address, city, state, zip } = body;

  if (!orgId || !name || !address) return NextResponse.json({ error: "orgId, name, and address required" }, { status: 400 });

  const supabase = createServiceClient();

  const { data, error } = await supabase.from("locations").insert({
    organization_id: orgId, name, address, city, state, zip,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create default temp log schedules
  const equipment = ["Walk-In Cooler", "Walk-In Freezer", "Prep Line Cooler", "Hot Hold Station", "Grill Station"];
  for (const eq of equipment) {
    await supabase.from("temp_log_schedule").insert({
      location_id: data.id,
      equipment_name: eq,
      scheduled_times: ["06:00", "11:00", "16:00", "21:00"],
      grace_period_min: 30,
      assigned_role: "cook",
    });
  }

  // Create default staffing targets
  const targets = [
    { role: "server", target_count: 8, min_count: 5 },
    { role: "cook", target_count: 4, min_count: 3 },
    { role: "host", target_count: 2, min_count: 1 },
    { role: "dishwasher", target_count: 2, min_count: 1 },
    { role: "manager", target_count: 2, min_count: 1 },
  ];
  for (const t of targets) {
    await supabase.from("staffing_targets").insert({ location_id: data.id, ...t });
  }

  return NextResponse.json({ locationId: data.id });
}
