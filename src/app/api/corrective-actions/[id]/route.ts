import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Resolve a corrective action
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { status, resolution_notes, resolved_by } = body;

  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (resolution_notes) updates.resolution_notes = resolution_notes;
  if (resolved_by) updates.resolved_by = resolved_by;
  if (status === "resolved") {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("corrective_actions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the resolution
  if (status === "resolved") {
    await supabase.from("agent_events").insert({
      agent_type: "food_safety",
      event_type: "corrective_resolved",
      location_id: data.location_id,
      severity: "info",
      description: `✅ Corrective action resolved: ${data.trigger_description}`,
      action_taken: `Resolved by ${resolved_by || "manager"}. Notes: ${resolution_notes || "N/A"}`,
      metadata: { corrective_id: id },
    });
  }

  return NextResponse.json({ success: true, data });
}
