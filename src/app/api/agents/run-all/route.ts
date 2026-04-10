import { NextResponse } from "next/server";
import { FoodSafetyAgent } from "@/agents/food-safety";
import { HiringAgent } from "@/agents/hiring";
import { StaffingAgent } from "@/agents/staffing";
import { CrossProductAgent } from "@/agents/cross-product";
import { ChecklistAgent } from "@/agents/checklist";
import { InventoryAgent } from "@/agents/inventory";
import { OrderAgent } from "@/agents/order";
import { WasteAgent } from "@/agents/waste";

// Manual trigger: run all in-scope agent checks.
// Removed agents (Apr 10 rebuild — pivoted away from POS/accounting/CRM
// integrations): InvoiceAgent, MarketingAgent, ReviewAgent,
// AccountantAgent, RevenueOptimizer, SpendOptimizer.
export async function GET() {
  try {
    const safety = new FoodSafetyAgent();
    const hiring = new HiringAgent();
    const staffing = new StaffingAgent();
    const cross = new CrossProductAgent();
    const checklist = new ChecklistAgent();
    const inventory = new InventoryAgent();
    const order = new OrderAgent();
    const waste = new WasteAgent();
    const startTime = Date.now();

    // Phase 1: Food Safety
    const [missedLogs, outOfRange, certs, corrective] = await Promise.all([
      safety.checkMissedTempLogs(),
      safety.checkOutOfRange(),
      safety.checkCertifications(),
      safety.checkCorrectiveActions(),
    ]);

    // Phase 2: Hiring + Staffing
    const [staffingCheck, screening, interviews, onboarding] = await Promise.all([
      hiring.checkStaffing(),
      hiring.screenCandidates(),
      hiring.checkInterviews(),
      hiring.processAcceptedOffers(),
    ]);

    const [busyDays, noShows] = await Promise.all([
      staffing.predictBusyDays(),
      staffing.detectNoShowPatterns(),
    ]);

    // Phase 3: Operations
    const [belowPar, expiringItems] = await Promise.all([
      inventory.checkBelowPar(),
      inventory.checkExpiringItems(),
    ]);

    const staleOrders = await order.checkStaleOrders();
    const missedChecklists = await checklist.checkMissedChecklists();
    const wasteEvents = await waste.check();

    // Phase 4: Cross-product (runs last — needs data from others)
    const [safetyStaffing, certsTraining, highRisk, weeklyInsights] = await Promise.all([
      cross.correlateSafetyAndStaffing(),
      cross.correlateCertsAndTraining(),
      cross.identifyHighRiskStores(),
      cross.generateWeeklyInsights(),
    ]);

    const allEvents = [
      ...missedLogs, ...outOfRange, ...certs, ...corrective,
      ...staffingCheck, ...screening, ...interviews, ...onboarding,
      ...busyDays, ...noShows,
      ...belowPar, ...expiringItems,
      ...staleOrders,
      ...missedChecklists,
      ...wasteEvents,
      ...safetyStaffing, ...certsTraining, ...highRisk, ...weeklyInsights,
    ];

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,
      agents: 8,
      summary: {
        food_safety: {
          missed_logs: missedLogs.length,
          out_of_range: outOfRange.length,
          cert_alerts: certs.length,
          overdue_corrective: corrective.length,
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
        inventory: {
          below_par: belowPar.length,
          expiring: expiringItems.length,
        },
        order_manager: { stale_orders: staleOrders.length },
        checklist_manager: { missed: missedChecklists.length },
        waste: { events: wasteEvents.length },
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
