import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");

  const supabase = createServiceClient();
  let query = supabase.from("employees").select("*, locations!inner(name)").order("name");
  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { location_id, name, role, email, phone } = body;

  if (!location_id || !name || !role) {
    return NextResponse.json({ error: "location_id, name, and role required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: loc } = await supabase.from("locations").select("organization_id").eq("id", location_id).single();

  const { data, error } = await supabase.from("employees").insert({
    organization_id: loc?.organization_id,
    location_id, name, role, email, phone,
    hire_date: new Date().toISOString().split("T")[0],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
