import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/vendors/[id] — Vendor detail with order history
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    // Get invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, due_date, total, status, created_at")
      .eq("vendor_id", id)
      .order("invoice_date", { ascending: false });

    // Get price history
    const { data: priceHistory } = await supabase
      .from("vendor_price_history")
      .select("*")
      .eq("vendor_id", id)
      .order("recorded_at", { ascending: false })
      .limit(100);

    // Spending summary
    const totalSpend = (invoices || [])
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + Number(i.total || 0), 0);

    return NextResponse.json({
      ...vendor,
      invoices: invoices || [],
      price_history: priceHistory || [],
      total_spend: totalSpend,
      invoice_count: invoices?.length || 0,
    });
  } catch (err) {
    console.error("GET /api/vendors/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
