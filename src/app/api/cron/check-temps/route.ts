import { NextResponse } from "next/server";
import { FoodSafetyAgent } from "@/agents/food-safety";

// Vercel Cron: every 30 minutes
// Add to vercel.json: { "path": "/api/cron/check-temps", "schedule": "*/30 * * * *" }

export async function GET(request: Request) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new FoodSafetyAgent();

    // Run both checks
    const [missedLogs, outOfRange] = await Promise.all([
      agent.checkMissedTempLogs(),
      agent.checkOutOfRange(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        missed_logs: missedLogs.length,
        out_of_range: outOfRange.length,
        total_events: missedLogs.length + outOfRange.length,
      },
      events: [...missedLogs, ...outOfRange],
    });
  } catch (err) {
    console.error("check-temps cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
