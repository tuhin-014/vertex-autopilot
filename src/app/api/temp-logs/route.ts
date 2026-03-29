import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Log a temperature reading
export async function POST(request: Request) {
  const body = await request.json();
  const { location_id, equipment, temperature, recorder_name, notes } = body;

  if (!location_id || !equipment || temperature === undefined) {
    return NextResponse.json({ error: "location_id, equipment, and temperature required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get organization_id from location
  const { data: loc } = await supabase.from("locations").select("organization_id").eq("id", location_id).single();

  const { data, error } = await supabase.from("temp_logs").insert({
    organization_id: loc?.organization_id,
    location_id,
    equipment,
    temperature: Number(temperature),
    recorder_name: recorder_name || "Dashboard",
    notes,
    status: "normal",
    recorded_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if out of range
  const temp = Number(temperature);
  const isCold = equipment.toLowerCase().includes("cooler") || equipment.toLowerCase().includes("freezer");
  const isHot = equipment.toLowerCase().includes("hot") || equipment.toLowerCase().includes("grill");
  const violation = (isCold && temp > 41) || (isHot && temp < 135);

  if (violation) {
    await supabase.from("temp_logs").update({ status: "flagged" }).eq("id", data.id);
  }

  return NextResponse.json({ success: true, data, violation });
}

// Get recent temp logs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const limit = Number(searchParams.get("limit")) || 50;

  const supabase = createServiceClient();
  let query = supabase.from("temp_logs").select("*, locations!inner(name)").order("recorded_at", { ascending: false }).limit(limit);
  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
