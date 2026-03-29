import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Approve or reject an approval queue item
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { action } = body; // "approve" or "reject"

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("approval_queue")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the decision
  await supabase.from("agent_events").insert({
    agent_type: data.agent_type,
    event_type: `approval_${action}d`,
    location_id: data.location_id,
    severity: "info",
    description: `${action === "approve" ? "✅" : "❌"} ${data.action_type} ${action}d by manager`,
    action_taken: `${data.action_type} ${action}d`,
    metadata: { approval_id: id, payload: data.payload },
  });

  return NextResponse.json({ success: true, status: data.status });
}
