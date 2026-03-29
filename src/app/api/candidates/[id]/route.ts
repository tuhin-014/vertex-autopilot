import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Update candidate stage, notes, offer
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("candidates_pipeline")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log stage changes
  if (body.stage) {
    await supabase.from("agent_events").insert({
      agent_type: "hiring",
      event_type: `candidate_${body.stage}`,
      location_id: data.location_id,
      severity: "info",
      description: `👤 ${data.name} moved to "${body.stage}" stage for ${data.role_applied}`,
      metadata: { candidate_id: id, stage: body.stage },
    });
  }

  return NextResponse.json({ success: true, data });
}
