import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// PUT /api/employees/[id]/certifications/[certId] — update cert (expiry, issued_date, type)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; certId: string }> }
) {
  try {
    const { certId } = await params;
    const body = await request.json();
    const { cert_type, issued_date, expiry_date } = body;

    const updates: Record<string, unknown> = {};
    if (cert_type !== undefined) updates.cert_type = cert_type.trim();
    if (issued_date !== undefined) updates.issued_date = issued_date || null;
    if (expiry_date !== undefined) updates.expiry_date = expiry_date;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("certifications")
      .update(updates)
      .eq("id", certId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PUT /api/employees/[id]/certifications/[certId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/employees/[id]/certifications/[certId] — remove a certification
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; certId: string }> }
) {
  try {
    const { certId } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("certifications")
      .delete()
      .eq("id", certId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/employees/[id]/certifications/[certId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
