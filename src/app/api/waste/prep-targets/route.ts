import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("prep_targets").select("*, inventory_items(name, category)").order("day_of_week");
  return NextResponse.json({ targets: data || [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { id, suggested_qty, based_on } = body;

  const { data, error } = await supabase
    .from("prep_targets")
    .update({ suggested_qty, based_on: based_on || "manual", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, target: data });
}
