import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// PUT /api/certifications/[id] — update cert (type, issued date, expiry date)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { cert_type, issued_date, expiry_date } = body;

    const supabase = createServiceClient();
    const updates: Record<string, unknown> = {};

    if (cert_type !== undefined) updates.cert_type = cert_type.trim();
    if (issued_date !== undefined) updates.issued_date = issued_date || null;
    if (expiry_date !== undefined) {
      updates.expiry_date = expiry_date;
      // Auto-update status based on new expiry
      const today = new Date().toISOString().split("T")[0];
      updates.status = expiry_date < today ? "expired" : "active";
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("certifications")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PUT /api/certifications/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/certifications/[id] — remove a certification
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase.from("certifications").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/certifications/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
