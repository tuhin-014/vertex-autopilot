import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceClient();

  // Check if checklist already started for this shift
  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await supabase
    .from("checklist_completions")
    .select("id")
    .eq("template_id", body.template_id)
    .eq("shift_date", today)
    .eq("shift_type", body.shift_type)
    .limit(1)
    .single();

  if (existing) {
    // Return existing completion
    const { data } = await supabase
      .from("checklist_completions")
      .select("*, checklist_templates:template_id(*)")
      .eq("id", existing.id)
      .single();
    return NextResponse.json({ completion: data, existing: true });
  }

  const { data, error } = await supabase
    .from("checklist_completions")
    .insert({
      template_id: body.template_id,
      location_id: body.location_id,
      completed_by: body.completed_by,
      shift_date: today,
      shift_type: body.shift_type,
      status: "in_progress",
      items_completed: (body.template_items || []).map((task: string) => ({
        task,
        completed: false,
        completed_at: null,
        photo_url: null,
        notes: null,
      })),
      completion_pct: 0,
    })
    .select("*, checklist_templates:template_id(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ completion: data, existing: false }, { status: 201 });
}
