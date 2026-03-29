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

  // Trigger real workflows on approval
  if (action === "approve" && data.payload) {
    const payload = data.payload as Record<string, unknown>;

    // Hire decision → advance candidate + send offer
    if (data.action_type === "hire_decision" && payload.candidate_id) {
      await supabase
        .from("candidates_pipeline")
        .update({ stage: "offered", offer_sent: true, updated_at: new Date().toISOString() })
        .eq("id", payload.candidate_id);

      // Get candidate phone for notification
      const { data: candidate } = await supabase
        .from("candidates_pipeline")
        .select("name, phone, role_applied")
        .eq("id", payload.candidate_id)
        .single();

      if (candidate?.phone) {
        const { sendSMS } = await import("@/lib/sms/twilio");
        await sendSMS(candidate.phone,
          `🎉 Great news, ${candidate.name}! We'd like to offer you the ${candidate.role_applied} position. Check your email for the offer letter, or call us to discuss.\n—Vertex Hire`
        );
      }

      await supabase.from("agent_events").insert({
        agent_type: "hiring",
        event_type: "offer_sent",
        location_id: data.location_id,
        severity: "info",
        description: `📨 Offer sent to ${payload.candidate_name} for ${payload.role} — SMS notification delivered`,
        metadata: { candidate_id: payload.candidate_id },
      });
    }

    // On-site visit → log scheduled visit
    if (data.action_type === "on_site_visit") {
      await supabase.from("agent_events").insert({
        agent_type: "cross_product",
        event_type: "visit_scheduled",
        location_id: data.location_id,
        severity: "info",
        description: `📅 On-site visit approved for ${payload.store_name} (Risk Score: ${payload.risk_score})`,
        metadata: payload,
      });
    }
  }

  return NextResponse.json({ success: true, status: data.status });
}
