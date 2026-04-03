import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/invoices/price-alerts — Items with >5% price increase
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get("threshold") || "5");

    const { data, error } = await supabase
      .from("invoice_items")
      .select("*, invoices!inner(id, invoice_number, invoice_date, vendor_id, vendors!inner(name))")
      .gt("price_change_pct", threshold)
      .order("price_change_pct", { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("GET /api/invoices/price-alerts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
