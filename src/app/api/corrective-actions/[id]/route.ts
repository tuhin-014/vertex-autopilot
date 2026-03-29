import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("corrective_actions").select("*, locations(name)").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const supabase = createServiceClient();
  const updates: Record<string, unknown> = {};

  if (body.status) updates.status = body.status;
  if (body.resolution_notes) updates.resolution_notes = body.resolution_notes;
  if (body.resolved_by) updates.resolved_by = body.resolved_by;
  if (body.action_steps) updates.action_steps = body.action_steps;
  if (body.status === "resolved") updates.resolved_at = new Date().toISOString();

  const { data, error } = await supabase.from("corrective_actions").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.status === "resolved") {
    await supabase.from("agent_events").insert({
      agent_type: "food_safety",
      event_type: "corrective_resolved",
      location_id: data.location_id,
      severity: "info",
      description: `✅ Corrective action resolved: ${data.trigger_description}`,
      action_taken: `Resolved by ${body.resolved_by || "staff"}. Notes: ${body.resolution_notes || "N/A"}`,
      metadata: { corrective_id: id },
    });
  }

  return NextResponse.json({ success: true, data });
}
