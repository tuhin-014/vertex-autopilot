import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/purchase-orders — List POs
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("purchase_orders")
      .select("*, vendors(name)")
      .order("created_at", { ascending: false });

    const locationId = searchParams.get("location_id");
    if (locationId) query = query.eq("location_id", locationId);

    const status = searchParams.get("status");
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Enrich with item counts
    const enriched = await Promise.all(
      (data || []).map(async (po) => {
        const { data: items } = await supabase
          .from("purchase_order_items")
          .select("id")
          .eq("po_id", po.id);
        return { ...po, item_count: items?.length || 0 };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/purchase-orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/purchase-orders — Create PO
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    let items = body.items || [];
    let totalEstimated = body.total_estimated || 0;

    // If auto_generate, build from below-par items
    if (body.auto_generate && body.vendor_id) {
      const { data: belowPar } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("preferred_vendor_id", body.vendor_id)
        .not("par_level", "is", null);

      items = (belowPar || [])
        .filter((item) => Number(item.current_stock) < Number(item.par_level))
        .map((item) => {
          const qty = Number(item.max_level || item.par_level) - Number(item.current_stock);
          const est = qty * Number(item.unit_cost || 0);
          totalEstimated += est;
          return {
            item_id: item.id,
            quantity: qty,
            unit: item.unit,
            estimated_unit_cost: item.unit_cost,
            estimated_total: est,
          };
        });
    }

    const { data: po, error } = await supabase
      .from("purchase_orders")
      .insert({
        location_id: body.location_id,
        vendor_id: body.vendor_id,
        status: body.status || "draft",
        total_estimated: totalEstimated,
        notes: body.notes || null,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Insert PO items
    if (items.length > 0 && po) {
      await supabase
        .from("purchase_order_items")
        .insert(items.map((i: Record<string, unknown>) => ({ ...i, po_id: po.id })));
    }

    return NextResponse.json({ ...po, items }, { status: 201 });
  } catch (err) {
    console.error("POST /api/purchase-orders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
