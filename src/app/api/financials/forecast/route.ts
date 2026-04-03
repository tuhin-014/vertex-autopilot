import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  // Get last 30 days of financials
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const { data } = await supabase
    .from("daily_financials")
    .select("*")
    .gte("date", start.toISOString().split("T")[0])
    .order("date");

  const rows = data || [];
  if (rows.length < 7) {
    return NextResponse.json({ forecast: [], message: "Need at least 7 days of data for forecast" });
  }

  // Simple moving average forecast for next 30 days
  const avgRevenue = rows.reduce((s: number, r: any) => s + Number(r.revenue || 0), 0) / rows.length;
  const avgFoodCost = rows.reduce((s: number, r: any) => s + Number(r.food_cost || 0), 0) / rows.length;
  const avgLaborCost = rows.reduce((s: number, r: any) => s + Number(r.labor_cost || 0), 0) / rows.length;
  const avgOther = rows.reduce((s: number, r: any) => s + Number(r.other_expenses || 0), 0) / rows.length;
  const avgProfit = avgRevenue - avgFoodCost - avgLaborCost - avgOther;

  const forecast = [];
  let runningCash = 0;
  for (let i = 1; i <= 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    // Weekends get 1.2x, weekdays 1.0x
    const dayOfWeek = date.getDay();
    const multiplier = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) ? 1.2 : 1.0;
    const projRevenue = Math.round(avgRevenue * multiplier);
    const projProfit = Math.round(avgProfit * multiplier);
    runningCash += projProfit;
    forecast.push({
      date: date.toISOString().split("T")[0],
      projected_revenue: projRevenue,
      projected_profit: projProfit,
      cumulative_cash: runningCash,
    });
  }

  return NextResponse.json({
    forecast,
    basedOn: `${rows.length} days of data`,
    avgDailyRevenue: Math.round(avgRevenue),
    avgDailyProfit: Math.round(avgProfit),
    projected30DayCash: runningCash,
  });
}
