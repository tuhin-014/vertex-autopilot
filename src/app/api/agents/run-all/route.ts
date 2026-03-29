import { NextResponse } from "next/server";
import { FoodSafetyAgent } from "@/agents/food-safety";
import { HiringAgent } from "@/agents/hiring";
import { StaffingAgent } from "@/agents/staffing";
import { SpendOptimizer } from "@/agents/spend-optimizer";
import { RevenueOptimizer } from "@/agents/revenue-optimizer";
import { CrossProductAgent } from "@/agents/cross-product";

// Manual trigger: run ALL 6 agent checks (for testing/demo)
export async function GET() {
  try {
    const safety = new FoodSafetyAgent();
    const hiring = new HiringAgent();
    const staffing = new StaffingAgent();
    const spend = new SpendOptimizer();
    const revenue = new RevenueOptimizer();
    const cross = new CrossProductAgent();
    const startTime = Date.now();

    // Phase 1 agents (existing)
    const [missedLogs, outOfRange, certs, corrective, patterns] = await Promise.all([
      safety.checkMissedTempLogs(),
      safety.checkOutOfRange(),
      safety.checkCertifications(),
      safety.checkCorrectiveActions(),
      safety.detectPatterns(),
    ]);

    const [staffingCheck, screening, interviews, onboarding] = await Promise.all([
      hiring.checkStaffing(),
      hiring.screenCandidates(),
      hiring.checkInterviews(),
      hiring.processAcceptedOffers(),
    ]);

    // Phase 2 agents (new)
    const [busyDays, noShows] = await Promise.all([
      staffing.predictBusyDays(),
      staffing.detectNoShowPatterns(),
    ]);

    const [anomalies, overdueCosts] = await Promise.all([
      spend.detectAnomalies(),
      spend.trackOverdueCosts(),
    ]);

    const [weatherRec, dayPatterns] = await Promise.all([
      revenue.checkWeatherImpact(),
      revenue.analyzeDayPatterns(),
    ]);

    // Cross-product runs last (needs data from others)
    const [safetyStaffing, certsTraining, highRisk, weeklyInsights] = await Promise.all([
      cross.correlateSafetyAndStaffing(),
      cross.correlateCertsAndTraining(),
      cross.identifyHighRiskStores(),
      cross.generateWeeklyInsights(),
    ]);

    const allEvents = [
      ...missedLogs, ...outOfRange, ...certs, ...corrective, ...patterns,
      ...staffingCheck, ...screening, ...interviews, ...onboarding,
      ...busyDays, ...noShows,
      ...anomalies, ...overdueCosts,
      ...weatherRec, ...dayPatterns,
      ...safetyStaffing, ...certsTraining, ...highRisk, ...weeklyInsights,
    ];

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,
      agents: 6,
      summary: {
        food_safety: {
          missed_logs: missedLogs.length,
          out_of_range: outOfRange.length,
          cert_alerts: certs.length,
          overdue_corrective: corrective.length,
          patterns: patterns.length,
        },
        hiring: {
          understaffed: staffingCheck.length,
          screened: screening.length,
          interview_followups: interviews.length,
          onboardings: onboarding.length,
        },
        staffing: {
          busy_day_warnings: busyDays.length,
          chronic_understaffing: noShows.length,
        },
        spend_optimizer: {
          anomalies: anomalies.length,
          overdue_cost_risks: overdueCosts.length,
        },
        revenue_optimizer: {
          weather_recommendations: weatherRec.length,
          day_patterns: dayPatterns.length,
        },
        cross_product: {
          safety_staffing_correlations: safetyStaffing.length,
          training_gaps: certsTraining.length,
          high_risk_stores: highRisk.length,
          weekly_insights: weeklyInsights.length,
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
