import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "week"; // week or month

  const now = new Date();
  const start = new Date();
  if (period === "week") start.setDate(now.getDate() - 7);
  else start.setDate(now.getDate() - 30);

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - (period === "week" ? 7 : 30));

  const dateStr = (d: Date) => d.toISOString().split("T")[0];

  const [current, previous] = await Promise.all([
    supabase.from("daily_financials").select("*").gte("date", dateStr(start)).lte("date", dateStr(now)).order("date"),
    supabase.from("daily_financials").select("*").gte("date", dateStr(prevStart)).lte("date", dateStr(new Date(prevStart.getTime() + (period === "week" ? 6 : 29) * 86400000))).order("date"),
  ]);

  const sum = (rows: any[], field: string) => rows.reduce((s: number, r: any) => s + Number(r[field] || 0), 0);

  const curr = current.data || [];
  const prev = previous.data || [];

  const currRevenue = sum(curr, "revenue");
  const prevRevenue = sum(prev, "revenue");
  const currProfit = sum(curr, "net_profit");
  const prevProfit = sum(prev, "net_profit");
  const currFood = sum(curr, "food_cost");
  const prevFood = sum(prev, "food_cost");
  const currLabor = sum(curr, "labor_cost");
  const prevLabor = sum(prev, "labor_cost");

  return NextResponse.json({
    period,
    current: { revenue: currRevenue, net_profit: currProfit, food_cost: currFood, labor_cost: currLabor, days: curr.length },
    previous: { revenue: prevRevenue, net_profit: prevProfit, food_cost: prevFood, labor_cost: currLabor, days: prev.length },
    change: {
      revenue_pct: prevRevenue > 0 ? Math.round(((currRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0,
      profit_pct: prevProfit > 0 ? Math.round(((currProfit - prevProfit) / prevProfit) * 1000) / 10 : 0,
    },
    daily_avg: {
      revenue: curr.length > 0 ? Math.round(currRevenue / curr.length) : 0,
      profit: curr.length > 0 ? Math.round(currProfit / curr.length) : 0,
    },
  });
}