import { NextResponse } from "next/server";
import { ChecklistAgent } from "@/agents/checklist";

// Runs every 30 minutes
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new ChecklistAgent();
    const events = await agent.check();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        missed_checklists: events.filter((e) => e.event_type === "missed_checklist").length,
        total_events: events.length,
      },
    });
  } catch (err) {
    console.error("check-checklists cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
