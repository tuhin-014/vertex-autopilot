import { NextResponse } from "next/server";
import { HiringAgent } from "@/agents/hiring";

// Vercel Cron: daily at 8 AM EST (13:00 UTC)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new HiringAgent();
    const [staffing, interviews, onboarding] = await Promise.all([
      agent.checkStaffing(),
      agent.checkInterviews(),
      agent.processAcceptedOffers(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        understaffed_roles: staffing.length,
        interview_followups: interviews.length,
        new_onboardings: onboarding.length,
        total: staffing.length + interviews.length + onboarding.length,
      },
      events: [...staffing, ...interviews, ...onboarding],
    });
  } catch (err) {
    console.error("check-staffing cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
