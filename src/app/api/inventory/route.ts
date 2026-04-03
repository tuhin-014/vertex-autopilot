import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/inventory — All items with stock levels + par status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("inventory_items")
      .select("*, vendors:preferred_vendor_id(id, name)")
      .order("category")
      .order("name");

    const locationId = searchParams.get("location_id");
    if (locationId) query = query.eq("location_id", locationId);

    const category = searchParams.get("category");
    if (category) query = query.eq("category", category);

    const storage = searchParams.get("storage_location");
    if (storage) query = query.eq("storage_location", storage);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Enrich with par status
    const enriched = (data || []).map((item) => {
      const stock = Number(item.current_stock);
      const par = Number(item.par_level || 0);
      let parStatus = "ok";
      if (par > 0) {
        const pct = (stock / par) * 100;
        if (pct <= 25) parStatus = "critical";
        else if (pct <= 50) parStatus = "low";
        else if (pct <= 75) parStatus = "warning";
      }
      return { ...item, par_status: parStatus };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/inventory error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/inventory — Add item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        location_id: body.location_id,
        name: body.name,
        category: body.category || null,
        unit: body.unit || null,
        par_level: body.par_level || null,
        max_level: body.max_level || null,
        current_stock: body.current_stock || 0,
        unit_cost: body.unit_cost || null,
        preferred_vendor_id: body.preferred_vendor_id || null,
        reorder_lead_days: body.reorder_lead_days || 2,
        shelf_life_days: body.shelf_life_days || null,
        storage_location: body.storage_location || null,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/inventory error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
