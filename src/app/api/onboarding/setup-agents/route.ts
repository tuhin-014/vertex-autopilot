import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { orgId, locationId, enableSafety, enableHiring } = body;

  const supabase = createServiceClient();

  // Log onboarding completion
  await supabase.from("agent_events").insert({
    agent_type: "system",
    event_type: "onboarding_complete",
    location_id: locationId || null,
    severity: "info",
    description: `🎉 New customer onboarded! Agents enabled: ${[enableSafety && "Food Safety", enableHiring && "Hiring"].filter(Boolean).join(", ")}`,
    metadata: { org_id: orgId, enable_safety: enableSafety, enable_hiring: enableHiring },
  });

  return NextResponse.json({ success: true, orgId, locationId, agents: { safety: enableSafety, hiring: enableHiring } });
}
