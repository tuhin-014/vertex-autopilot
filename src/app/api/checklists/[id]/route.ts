import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("checklist_completions")
    .select("*, checklist_templates:template_id(*)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ completion: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (body.items_completed) {
    updateData.items_completed = body.items_completed;
    const items = body.items_completed as { completed: boolean }[];
    const completedCount = items.filter((i) => i.completed).length;
    updateData.completion_pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  }

  if (body.status) {
    updateData.status = body.status;
    if (body.status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }
  }

  if (body.handoff_notes !== undefined) updateData.handoff_notes = body.handoff_notes;

  const { data, error } = await supabase
    .from("checklist_completions")
    .update(updateData)
    .eq("id", id)
    .select("*, checklist_templates:template_id(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ completion: data });
}
