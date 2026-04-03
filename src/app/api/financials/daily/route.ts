import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "30");

  const start = new Date();
  start.setDate(start.getDate() - days);

  const { data } = await supabase
    .from("daily_financials")
    .select("*")
    .gte("date", start.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const rows = data || [];
  const totalRevenue = rows.reduce((s: number, r: any) => s + Number(r.revenue || 0), 0);
  const totalFoodCost = rows.reduce((s: number, r: any) => s + Number(r.food_cost || 0), 0);
  const totalLaborCost = rows.reduce((s: number, r: any) => s + Number(r.labor_cost || 0), 0);
  const totalOther = rows.reduce((s: number, r: any) => s + Number(r.other_expenses || 0), 0);
  const totalProfit = rows.reduce((s: number, r: any) => s + Number(r.net_profit || 0), 0);
  const avgFoodPct = totalRevenue > 0 ? (totalFoodCost / totalRevenue) * 100 : 0;
  const avgLaborPct = totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;

  return NextResponse.json({
    days, rows,
    summary: {
      totalRevenue, totalFoodCost, totalLaborCost, totalOther, totalProfit,
      avgFoodPct: Math.round(avgFoodPct * 10) / 10,
      avgLaborPct: Math.round(avgLaborPct * 10) / 10,
      avgDailyRevenue: rows.length > 0 ? Math.round(totalRevenue / rows.length) : 0,
      totalOrders: rows.reduce((s: number, r: any) => s + Number(r.order_count || 0), 0),
    },
  });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();

  const { data, error } = await supabase.from("daily_financials").upsert(body, { onConflict: "location_id,date" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, record: data });
}
