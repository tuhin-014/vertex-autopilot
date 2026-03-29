import { NextResponse } from "next/server";
import { FoodSafetyAgent } from "@/agents/food-safety";
import { HiringAgent } from "@/agents/hiring";

// Manual trigger: run ALL agent checks at once (for testing/demo)
export async function GET() {
  try {
    const safetyAgent = new FoodSafetyAgent();
    const hiringAgent = new HiringAgent();
    const startTime = Date.now();

    const [missedLogs, outOfRange, certs, corrective, patterns, staffing, screening, interviews, onboarding] = await Promise.all([
      safetyAgent.checkMissedTempLogs(),
      safetyAgent.checkOutOfRange(),
      safetyAgent.checkCertifications(),
      safetyAgent.checkCorrectiveActions(),
      safetyAgent.detectPatterns(),
      hiringAgent.checkStaffing(),
      hiringAgent.screenCandidates(),
      hiringAgent.checkInterviews(),
      hiringAgent.processAcceptedOffers(),
    ]);

    const allEvents = [...missedLogs, ...outOfRange, ...certs, ...corrective, ...patterns, ...staffing, ...screening, ...interviews, ...onboarding];
    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,
      summary: {
        food_safety: {
          missed_logs: missedLogs.length,
          out_of_range: outOfRange.length,
          cert_alerts: certs.length,
          overdue_corrective: corrective.length,
          patterns: patterns.length,
        },
        hiring: {
          understaffed_roles: staffing.length,
          candidates_screened: screening.length,
          interview_followups: interviews.length,
          onboardings: onboarding.length,
        },
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
