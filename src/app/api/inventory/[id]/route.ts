import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// PATCH /api/inventory/[id] — Update stock/par levels
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServiceClient();

    const updates: Record<string, unknown> = {};
    const allowed = [
      "name", "category", "unit", "par_level", "max_level",
      "current_stock", "unit_cost", "preferred_vendor_id",
      "reorder_lead_days", "shelf_life_days", "storage_location",
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (body.current_stock !== undefined) {
      updates.last_counted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/inventory/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
