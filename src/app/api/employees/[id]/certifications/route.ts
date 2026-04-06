import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/employees/[id]/certifications — list all certs for an employee
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .eq("employee_id", id)
      .order("expiry_date");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error("GET /api/employees/[id]/certifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/employees/[id]/certifications — add a certification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { cert_type, issued_date, expiry_date } = body;

    if (!cert_type || !expiry_date) {
      return NextResponse.json({ error: "cert_type and expiry_date are required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify employee exists
    const { data: emp } = await supabase
      .from("employees")
      .select("id, location_id")
      .eq("id", id)
      .single();

    if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("certifications")
      .insert({
        employee_id: id,
        location_id: emp.location_id,
        cert_type: cert_type.trim(),
        issued_date: issued_date || null,
        expiry_date,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/employees/[id]/certifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
