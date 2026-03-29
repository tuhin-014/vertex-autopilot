import { NextResponse } from "next/server";
import { HiringAgent } from "@/agents/hiring";

// Vercel Cron: every hour
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new HiringAgent();
    const events = await agent.screenCandidates();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        candidates_screened: events.length,
        accepted: events.filter((e) => e.event_type === "candidate_screened").length,
        rejected: events.filter((e) => e.event_type === "candidate_rejected").length,
      },
      events,
    });
  } catch (err) {
    console.error("screen-candidates cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
