import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "week";

  const now = new Date();
  let startDate = new Date();
  if (period === "week") startDate.setDate(now.getDate() - 7);
  else if (period === "month") startDate.setDate(now.getDate() - 30);
  else startDate.setDate(now.getDate() - 1);

  // Waste summary
  const { data: waste } = await supabase
    .from("waste_logs")
    .select("*, inventory_items(name, category)")
    .gte("logged_at", startDate.toISOString())
    .order("logged_at", { ascending: false });

  const items = waste || [];
  const totalCost = items.reduce((s: number, w: any) => s + Number(w.estimated_cost || 0), 0);
  const totalQty = items.reduce((s: number, w: any) => s + Number(w.quantity || 0), 0);

  // By category
  const byCategory: Record<string, { cost: number; count: number }> = {};
  const byReason: Record<string, { cost: number; count: number }> = {};
  const byItem: Record<string, { name: string; cost: number; count: number }> = {};

  for (const w of items as any[]) {
    const cat = w.inventory_items?.category || "other";
    if (!byCategory[cat]) byCategory[cat] = { cost: 0, count: 0 };
    byCategory[cat].cost += Number(w.estimated_cost || 0);
    byCategory[cat].count++;

    const reason = w.reason || "other";
    if (!byReason[reason]) byReason[reason] = { cost: 0, count: 0 };
    byReason[reason].cost += Number(w.estimated_cost || 0);
    byReason[reason].count++;

    const name = w.inventory_items?.name || "Unknown";
    if (!byItem[name]) byItem[name] = { name, cost: 0, count: 0 };
    byItem[name].cost += Number(w.estimated_cost || 0);
    byItem[name].count++;
  }

  const topItems = Object.values(byItem).sort((a, b) => b.cost - a.cost).slice(0, 10);

  return NextResponse.json({
    period, totalCost, totalQty, totalEntries: items.length,
    byCategory, byReason, topItems, recentEntries: items.slice(0, 20),
  });
}
