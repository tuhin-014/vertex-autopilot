import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Get notification preferences
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");

  const supabase = createServiceClient();
  let query = supabase.from("notification_preferences").select("*, locations!inner(name)").order("created_at");

  if (locationId) {
    query = query.eq("location_id", locationId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// Update notification preferences
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

// Add new notification contact
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("notification_preferences")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
