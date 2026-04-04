import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTemplateItems(items: any): { task: string; completed: boolean; completed_at: null; photo_url: null; notes: null }[] {
  // Handle JSON string
  let parsed = items;
  if (typeof items === 'string') {
    try { parsed = JSON.parse(items); } catch { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: string | { task?: string; required?: boolean }) => ({
    task: typeof item === 'string' ? item : (item.task || JSON.stringify(item)),
    completed: false,
    completed_at: null,
    photo_url: null,
    notes: null,
  }));
}

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
      items_completed: parseTemplateItems(body.template_items || []),
      completion_pct: 0,
    })
    .select("*, checklist_templates:template_id(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ completion: data, existing: false }, { status: 201 });
}
