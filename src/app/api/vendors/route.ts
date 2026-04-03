import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/vendors — Add vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("vendors")
      .insert({
        location_id: body.location_id,
        name: body.name,
        contact_name: body.contact_name || null,
        contact_email: body.contact_email || null,
        contact_phone: body.contact_phone || null,
        category: body.category || null,
        payment_terms: body.payment_terms || null,
        account_number: body.account_number || null,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("POST /api/vendors error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/vendors — List vendors with spend totals
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");

    let query = supabase
      .from("vendors")
      .select("*")
      .order("name");

    if (locationId) query = query.eq("location_id", locationId);

    const { data: vendors, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Get spend totals per vendor
    const enriched = await Promise.all(
      (vendors || []).map(async (vendor) => {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("total, status")
          .eq("vendor_id", vendor.id);

        const totalSpend = (invoices || [])
          .filter((i) => i.status === "paid")
          .reduce((s, i) => s + Number(i.total || 0), 0);

        const pendingAmount = (invoices || [])
          .filter((i) => i.status === "pending" || i.status === "approved")
          .reduce((s, i) => s + Number(i.total || 0), 0);

        return {
          ...vendor,
          total_spend: totalSpend,
          pending_amount: pendingAmount,
          invoice_count: invoices?.length || 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("GET /api/vendors error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
