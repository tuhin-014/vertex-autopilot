import { NextResponse } from "next/server";
import { FoodSafetyAgent } from "@/agents/food-safety";

// Manual trigger: run ALL food safety checks at once (for testing/demo)
export async function GET() {
  try {
    const agent = new FoodSafetyAgent();
    const startTime = Date.now();

    const [missedLogs, outOfRange, certs, corrective, patterns] = await Promise.all([
      agent.checkMissedTempLogs(),
      agent.checkOutOfRange(),
      agent.checkCertifications(),
      agent.checkCorrectiveActions(),
      agent.detectPatterns(),
    ]);

    const allEvents = [...missedLogs, ...outOfRange, ...certs, ...corrective, ...patterns];
    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,
      summary: {
        missed_logs: missedLogs.length,
        out_of_range: outOfRange.length,
        cert_alerts: certs.length,
        overdue_corrective: corrective.length,
        patterns: patterns.length,
        total: allEvents.length,
      },
      events: allEvents,
    });
  } catch (err) {
    console.error("run-all error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
