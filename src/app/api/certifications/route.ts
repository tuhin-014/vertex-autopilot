import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/certifications?employee_id=... — list certs for an employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employee_id");

    if (!employeeId) {
      return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .eq("employee_id", employeeId)
      .order("expiry_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error("GET /api/certifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/certifications — add a certification to an employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, cert_type, issued_date, expiry_date } = body;

    if (!employee_id || !cert_type || !expiry_date) {
      return NextResponse.json(
        { error: "employee_id, cert_type, and expiry_date are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Determine status based on expiry date
    const today = new Date().toISOString().split("T")[0];
    const status = expiry_date < today ? "expired" : "active";

    const { data, error } = await supabase
      .from("certifications")
      .insert({
        employee_id,
        cert_type: cert_type.trim(),
        issued_date: issued_date || null,
        expiry_date,
        status,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/certifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
