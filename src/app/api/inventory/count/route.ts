import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/inventory/count — Submit stock count
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    // body.counts = [{ item_id, counted_qty, notes? }]
    const counts = body.counts || [body]; // Support single or batch
    const results = [];

    for (const count of counts) {
      // Get current system qty
      const { data: item } = await supabase
        .from("inventory_items")
        .select("current_stock, location_id")
        .eq("id", count.item_id)
        .single();

      if (!item) continue;

      const systemQty = Number(item.current_stock);
      const countedQty = Number(count.counted_qty);
      const variance = countedQty - systemQty;

      // Record count
      const { data: countRecord } = await supabase
        .from("inventory_counts")
        .insert({
          location_id: count.location_id || item.location_id,
          item_id: count.item_id,
          counted_by: count.counted_by || body.counted_by || "Unknown",
          counted_qty: countedQty,
          system_qty: systemQty,
          variance,
          notes: count.notes || null,
        })
        .select("*")
        .single();

      // Update current stock
      await supabase
        .from("inventory_items")
        .update({
          current_stock: countedQty,
          last_counted_at: new Date().toISOString(),
        })
        .eq("id", count.item_id);

      results.push(countRecord);
    }

    return NextResponse.json({ counts: results, updated: results.length }, { status: 201 });
  } catch (err) {
    console.error("POST /api/inventory/count error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
