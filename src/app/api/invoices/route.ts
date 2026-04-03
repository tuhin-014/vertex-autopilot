import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { InvoiceAgent } from "@/agents/invoice";

// POST /api/invoices — Upload + OCR process invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();
    const agent = new InvoiceAgent();

    let ocrData: Record<string, unknown> | null = null;

    // If image_url provided, run OCR
    if (body.image_url) {
      ocrData = await agent.ocrInvoice(body.image_url);
    }

    // Merge OCR data with manual overrides
    const invoiceData = {
      location_id: body.location_id,
      vendor_id: body.vendor_id || null,
      invoice_number: body.invoice_number || (ocrData?.invoice_number as string) || null,
      invoice_date: body.invoice_date || (ocrData?.invoice_date as string) || null,
      due_date: body.due_date || (ocrData?.due_date as string) || null,
      subtotal: body.subtotal ?? (ocrData?.subtotal as number) ?? null,
      tax: body.tax ?? (ocrData?.tax as number) ?? null,
      total: body.total ?? (ocrData?.total as number) ?? null,
      status: "pending",
      image_url: body.image_url || null,
      ocr_raw: ocrData || null,
      notes: body.notes || null,
    };

    // If OCR found a vendor name but no vendor_id, try to match
    if (!invoiceData.vendor_id && ocrData?.vendor_name) {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id")
        .ilike("name", `%${ocrData.vendor_name}%`)
        .limit(1)
        .single();
      if (vendor) invoiceData.vendor_id = vendor.id;
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Insert line items
    const items = body.items || (ocrData?.items as Array<Record<string, unknown>>) || [];
    if (items.length > 0 && invoice) {
      const itemRows = [];
      for (const item of items) {
        // Compare prices if we have a vendor
        let previousPrice = null;
        let priceChangePct = null;
        if (invoiceData.vendor_id && item.unit_price) {
          const comparison = await agent.comparePriceAndRecord(
            invoiceData.vendor_id,
            item.description as string,
            Number(item.unit_price),
            (item.unit as string) || ""
          );
          previousPrice = comparison.previousPrice;
          priceChangePct = comparison.changePercent;
        }

        itemRows.push({
          invoice_id: invoice.id,
          description: item.description,
          category: item.category || null,
          quantity: item.quantity || null,
          unit: item.unit || null,
          unit_price: item.unit_price || null,
          total_price: item.total_price || null,
          previous_price: previousPrice,
          price_change_pct: priceChangePct,
        });
      }

      await supabase.from("invoice_items").insert(itemRows);
    }

    // Log agent event
    if (invoice) {
      await agent.logEvent({
        agent_type: "invoice_manager",
        event_type: "invoice_uploaded",
        location_id: invoice.location_id,
        severity: "info",
        description: `Invoice #${invoice.invoice_number || "N/A"} uploaded ($${invoice.total || 0})`,
        metadata: { invoice_id: invoice.id, ocr: !!ocrData },
      });
    }

    return NextResponse.json({ invoice, ocr_used: !!ocrData }, { status: 201 });
  } catch (err) {
    console.error("POST /api/invoices error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/invoices — List invoices (filterable)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("invoices")
      .select("*, vendors(name, category)")
      .order("created_at", { ascending: false });

    const status = searchParams.get("status");
    if (status) query = query.eq("status", status);

    const vendorId = searchParams.get("vendor_id");
    if (vendorId) query = query.eq("vendor_id", vendorId);

    const locationId = searchParams.get("location_id");
    if (locationId) query = query.eq("location_id", locationId);

    const from = searchParams.get("from");
    if (from) query = query.gte("invoice_date", from);

    const to = searchParams.get("to");
    if (to) query = query.lte("invoice_date", to);

    const limit = parseInt(searchParams.get("limit") || "50");
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET /api/invoices error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
