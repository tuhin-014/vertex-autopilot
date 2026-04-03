import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("waste_reports").select("*").order("created_at", { ascending: false }).limit(20);
  return NextResponse.json({ reports: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();
  const period = body.period || "weekly";

  const now = new Date();
  const start = new Date();
  if (period === "weekly") start.setDate(now.getDate() - 7);
  else start.setDate(now.getDate() - 30);

  const { data: waste } = await supabase
    .from("waste_logs")
    .select("*, inventory_items(name, category)")
    .gte("logged_at", start.toISOString());

  const items = waste || [];
  const totalCost = items.reduce((s: number, w: any) => s + Number(w.estimated_cost || 0), 0);

  const byItem: Record<string, { name: string; qty: number; cost: number; reason: string }> = {};
  for (const w of items as any[]) {
    const name = w.inventory_items?.name || "Unknown";
    if (!byItem[name]) byItem[name] = { name, qty: 0, cost: 0, reason: w.reason || "" };
    byItem[name].qty += Number(w.quantity || 0);
    byItem[name].cost += Number(w.estimated_cost || 0);
  }
  const topItems = Object.values(byItem).sort((a, b) => b.cost - a.cost).slice(0, 5);

  const suggestions = topItems.map(i => ({
    suggestion: `Reduce ${i.name} order by 15-20% — wasted $${i.cost.toFixed(2)} (${i.qty} units) this period`,
    estimated_savings: Math.round(i.cost * 0.6 * 100) / 100,
  }));

  const { data: report } = await supabase.from("waste_reports").insert({
    report_type: period,
    period_start: start.toISOString().split("T")[0],
    period_end: now.toISOString().split("T")[0],
    total_waste_cost: totalCost,
    total_items_wasted: items.length,
    top_wasted_items: topItems,
    suggestions,
    waste_pct_of_food_cost: 0,
  }).select().single();

  return NextResponse.json({ ok: true, report });
}
