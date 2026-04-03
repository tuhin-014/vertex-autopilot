import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/waste — Log waste
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    // Get item cost if not provided
    let estimatedCost = body.estimated_cost;
    if (!estimatedCost && body.item_id) {
      const { data: item } = await supabase
        .from("inventory_items")
        .select("unit_cost")
        .eq("id", body.item_id)
        .single();
      if (item?.unit_cost) {
        estimatedCost = Number(item.unit_cost) * Number(body.quantity || 0);
      }
    }

    const { data, error } = await supabase
      .from("waste_logs")
      .insert({
        location_id: body.location_id,
        item_id: body.item_id,
        quantity: body.quantity,
        unit: body.unit || null,
        reason: body.reason,
        estimated_cost: estimatedCost || null,
        logged_by: body.logged_by || "Unknown",
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Deduct from current stock
    if (body.item_id && body.quantity) {
      const { data: item } = await supabase
        .from("inventory_items")
        .select("current_stock")
        .eq("id", body.item_id)
        .single();

      if (item) {
        const newStock = Math.max(0, Number(item.current_stock) - Number(body.quantity));
        await supabase
          .from("inventory_items")
          .update({ current_stock: newStock })
          .eq("id", body.item_id);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/waste error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/waste — Waste report
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("waste_logs")
      .select("*, inventory_items(name, category)")
      .order("logged_at", { ascending: false });

    const locationId = searchParams.get("location_id");
    if (locationId) query = query.eq("location_id", locationId);

    const reason = searchParams.get("reason");
    if (reason) query = query.eq("reason", reason);

    const from = searchParams.get("from");
    if (from) query = query.gte("logged_at", from);

    const to = searchParams.get("to");
    if (to) query = query.lte("logged_at", to);

    const limit = parseInt(searchParams.get("limit") || "100");
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Summary
    const totalCost = (data || []).reduce((s, w) => s + Number(w.estimated_cost || 0), 0);
    const byReason: Record<string, { count: number; cost: number }> = {};
    for (const w of data || []) {
      const r = w.reason || "unknown";
      if (!byReason[r]) byReason[r] = { count: 0, cost: 0 };
      byReason[r].count++;
      byReason[r].cost += Number(w.estimated_cost || 0);
    }

    return NextResponse.json({ logs: data || [], summary: { total_cost: totalCost, by_reason: byReason, total_entries: data?.length || 0 } });
  } catch (err) {
    console.error("GET /api/waste error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
