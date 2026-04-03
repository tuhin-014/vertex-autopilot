import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const type = searchParams.get("type");

  const supabase = createServiceClient();
  let query = supabase.from("checklist_templates").select("*").order("type").order("name");

  if (locationId) query = query.eq("location_id", locationId);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("checklist_templates")
    .insert({
      location_id: body.location_id,
      name: body.name,
      type: body.type,
      items: body.items,
      deadline_minutes: body.deadline_minutes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
