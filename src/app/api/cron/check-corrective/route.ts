import { NextResponse } from "next/server";
import { FoodSafetyAgent } from "@/agents/food-safety";

// Vercel Cron: every 2 hours during business hours
// Add to vercel.json: { "path": "/api/cron/check-corrective", "schedule": "0 */2 * * *" }

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new FoodSafetyAgent();
    const corrective = await agent.checkCorrectiveActions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        overdue_actions: corrective.length,
        total_events: corrective.length,
      },
      events: corrective,
    });
  } catch (err) {
    console.error("check-corrective cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
