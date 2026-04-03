import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const alerts: any[] = [];

  // Check latest daily financials for cost overruns
  const { data: recent } = await supabase
    .from("daily_financials")
    .select("*, locations:location_id(name)")
    .order("date", { ascending: false })
    .limit(10);

  for (const r of (recent || []) as any[]) {
    if (Number(r.food_cost_pct) > 35) {
      alerts.push({ type: "high_food_cost", severity: "warning", location: r.locations?.name, date: r.date, value: r.food_cost_pct, message: `Food cost ${r.food_cost_pct}% (target <35%)` });
    }
    if (Number(r.labor_cost_pct) > 35) {
      alerts.push({ type: "high_labor_cost", severity: "warning", location: r.locations?.name, date: r.date, value: r.labor_cost_pct, message: `Labor cost ${r.labor_cost_pct}% (target <35%)` });
    }
    if (Number(r.net_profit) < 0) {
      alerts.push({ type: "daily_loss", severity: "critical", location: r.locations?.name, date: r.date, value: r.net_profit, message: `Daily loss of $${Math.abs(r.net_profit).toFixed(2)}` });
    }
  }

  return NextResponse.json({ alerts, count: alerts.length });
}
