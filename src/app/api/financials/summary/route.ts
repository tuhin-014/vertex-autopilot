import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "week";

  const now = new Date();
  const start = new Date();
  if (period === "week") start.setDate(now.getDate() - 7);
  else start.setDate(now.getDate() - 30);

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - (period === "week" ? 7 : 30));

  const dateStr = (d: Date) => d.toISOString().split("T")[0];

  // Get daily_financials data (legacy/manual)
  const [current, previous] = await Promise.all([
    supabase.from("daily_financials").select("*").gte("date", dateStr(start)).lte("date", dateStr(now)).order("date"),
    supabase.from("daily_financials").select("*").gte("date", dateStr(prevStart)).lte("date", dateStr(new Date(prevStart.getTime() + (period === "week" ? 6 : 29) * 86400000))).order("date"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sum = (rows: any[], field: string) => rows.reduce((s: number, r: any) => s + Number(r[field] || 0), 0);

  const curr = current.data || [];
  const prev = previous.data || [];

  // ALSO compute live revenue from orders (payment_status = paid)
  const { data: paidOrders } = await supabase
    .from("orders")
    .select("total, tip, payment_method, channel, created_at, payment_status")
    .gte("created_at", start.toISOString())
    .order("created_at");

  const allPaid = (paidOrders || []).filter(o => o.payment_status === "paid");
  const liveRevenue = allPaid.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const liveTips = allPaid.reduce((s, o) => s + (Number(o.tip) || 0), 0);
  const totalOrders = paidOrders?.length || 0;
  const paidOrderCount = allPaid.length;

  // Revenue by channel
  const byChannel: Record<string, { count: number; revenue: number }> = {};
  for (const o of allPaid) {
    const ch = o.channel || "unknown";
    if (!byChannel[ch]) byChannel[ch] = { count: 0, revenue: 0 };
    byChannel[ch].count++;
    byChannel[ch].revenue += Number(o.total) || 0;
  }

  // Revenue by payment method
  const byMethod: Record<string, { count: number; revenue: number }> = {};
  for (const o of allPaid) {
    const m = o.payment_method || "unknown";
    if (!byMethod[m]) byMethod[m] = { count: 0, revenue: 0 };
    byMethod[m].count++;
    byMethod[m].revenue += Number(o.total) || 0;
  }

  // Daily revenue from orders
  const dailyRevenue: Record<string, number> = {};
  for (const o of allPaid) {
    const day = o.created_at?.split("T")[0] || "unknown";
    dailyRevenue[day] = (dailyRevenue[day] || 0) + (Number(o.total) || 0);
  }

  // Use daily_financials if available, fallback to live orders
  const currRevenue = curr.length > 0 ? sum(curr, "revenue") : liveRevenue;
  const prevRevenue = prev.length > 0 ? sum(prev, "revenue") : 0;
  const currProfit = curr.length > 0 ? sum(curr, "net_profit") : liveRevenue * 0.15; // estimate 15% margin
  const prevProfit = prev.length > 0 ? sum(prev, "net_profit") : 0;
  const currFood = curr.length > 0 ? sum(curr, "food_cost") : liveRevenue * 0.30;
  const currLabor = curr.length > 0 ? sum(curr, "labor_cost") : liveRevenue * 0.30;

  return NextResponse.json({
    period,
    current: { revenue: currRevenue, net_profit: currProfit, food_cost: currFood, labor_cost: currLabor, days: curr.length || 7 },
    previous: { revenue: prevRevenue, net_profit: prevProfit },
    change: {
      revenue_pct: prevRevenue > 0 ? Math.round(((currRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0,
      profit_pct: prevProfit > 0 ? Math.round(((currProfit - prevProfit) / prevProfit) * 1000) / 10 : 0,
    },
    daily_avg: {
      revenue: curr.length > 0 ? Math.round(currRevenue / curr.length) : Math.round(liveRevenue / 7),
      profit: curr.length > 0 ? Math.round(currProfit / curr.length) : Math.round((liveRevenue * 0.15) / 7),
    },
    // NEW: Live payment data
    live: {
      total_orders: totalOrders,
      paid_orders: paidOrderCount,
      revenue: liveRevenue,
      tips: liveTips,
      avg_ticket: paidOrderCount > 0 ? Math.round((liveRevenue / paidOrderCount) * 100) / 100 : 0,
      by_channel: byChannel,
      by_method: byMethod,
      daily_revenue: dailyRevenue,
    },
  });
}
