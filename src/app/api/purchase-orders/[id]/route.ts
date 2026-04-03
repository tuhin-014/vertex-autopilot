import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/purchase-orders/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: po, error } = await supabase
      .from("purchase_orders")
      .select("*, vendors(id, name, contact_name, contact_email)")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: "PO not found" }, { status: 404 });

    const { data: items } = await supabase
      .from("purchase_order_items")
      .select("*, inventory_items(name, category, unit)")
      .eq("po_id", id);

    return NextResponse.json({ ...po, items: items || [] });
  } catch (err) {
    console.error("GET /api/purchase-orders/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/purchase-orders/[id] — Update PO status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServiceClient();

    const updates: Record<string, unknown> = {};

    if (body.status) {
      updates.status = body.status;
      if (body.status === "submitted") updates.submitted_at = new Date().toISOString();
      if (body.status === "received") {
        updates.received_at = new Date().toISOString();

        // Update inventory stock levels from PO items
        const { data: items } = await supabase
          .from("purchase_order_items")
          .select("item_id, quantity")
          .eq("po_id", id);

        for (const item of items || []) {
          const { data: invItem } = await supabase
            .from("inventory_items")
            .select("current_stock")
            .eq("id", item.item_id)
            .single();

          if (invItem) {
            await supabase
              .from("inventory_items")
              .update({
                current_stock: Number(invItem.current_stock) + Number(item.quantity),
                last_counted_at: new Date().toISOString(),
              })
              .eq("id", item.item_id);
          }
        }
      }
    }
    if (body.notes !== undefined) updates.notes = body.notes;

    const { data, error } = await supabase
      .from("purchase_orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/purchase-orders/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
