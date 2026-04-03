import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/invoices/[id] — Invoice detail with line items
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, vendors(id, name, contact_name, contact_email, contact_phone, category, payment_terms)")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("id");

    return NextResponse.json({ ...invoice, items: items || [] });
  } catch (err) {
    console.error("GET /api/invoices/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] — Update status (approve, pay, dispute)
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
      if (body.status === "approved") {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = body.approved_by || null;
      }
      if (body.status === "paid") {
        updates.paid_at = new Date().toISOString();
      }
    }
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.due_date) updates.due_date = body.due_date;

    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(data);
  } catch (err) {
    console.error("PATCH /api/invoices/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
