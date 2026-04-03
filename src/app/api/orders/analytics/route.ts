import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const days = parseInt(searchParams.get("days") || "30");

  const supabase = createServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("orders")
    .select("created_at, total, channel, status, items")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = data || [];

  // Channel breakdown
  const channelBreakdown: Record<string, { count: number; revenue: number }> = {};
  for (const order of orders) {
    const ch = order.channel || "unknown";
    if (!channelBreakdown[ch]) channelBreakdown[ch] = { count: 0, revenue: 0 };
    channelBreakdown[ch].count++;
    channelBreakdown[ch].revenue += Number(order.total || 0);
  }

  // Peak hours (by hour of day)
  const peakHours: Record<string, number> = {};
  for (const order of orders) {
    const hour = new Date(order.created_at).getHours();
    const key = `${hour}:00`;
    peakHours[key] = (peakHours[key] || 0) + 1;
  }

  // Avg ticket
  const completedOrders = orders.filter((o) => o.status === "completed");
  const avgTicket =
    completedOrders.length > 0
      ? completedOrders.reduce((s, o) => s + Number(o.total || 0), 0) / completedOrders.length
      : 0;

  // Total revenue
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0);

  // Popular items
  const itemCounts: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items || []) {
      const name = typeof item === "object" ? (item as { name?: string }).name : String(item);
      if (name) itemCounts[name] = (itemCounts[name] || 0) + 1;
    }
  }
  const popularItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Daily totals
  const dailyTotals: Record<string, { orders: number; revenue: number }> = {};
  for (const order of completedOrders) {
    const day = order.created_at.split("T")[0];
    if (!dailyTotals[day]) dailyTotals[day] = { orders: 0, revenue: 0 };
    dailyTotals[day].orders++;
    dailyTotals[day].revenue += Number(order.total || 0);
  }

  return NextResponse.json({
    summary: {
      total_orders: orders.length,
      completed_orders: completedOrders.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      avg_ticket: Math.round(avgTicket * 100) / 100,
      cancellation_rate:
        orders.length > 0
          ? Math.round((orders.filter((o) => o.status === "cancelled").length / orders.length) * 10000) / 100
          : 0,
    },
    channel_breakdown: channelBreakdown,
    peak_hours: peakHours,
    popular_items: popularItems,
    daily_totals: dailyTotals,
  });
}
