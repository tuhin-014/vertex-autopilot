import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/employees — list all employees (with optional location_id + role filters)
// Returns employees with their location name and cert counts enriched
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const role = searchParams.get("role");

    let query = supabase
      .from("employees")
      .select("*, locations!inner(name)")
      .is("status", null) // only active (status null = active)
      .order("name");

    // Also include explicitly active employees
    // Use or filter: status is null OR status = 'active'
    query = supabase
      .from("employees")
      .select("*, locations!inner(name)")
      .or("status.is.null,status.eq.active")
      .order("name");

    if (locationId) query = query.eq("location_id", locationId);
    if (role) query = query.eq("role", role);

    const { data: employees, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Enrich each employee with cert counts
    const enriched = await Promise.all(
      (employees || []).map(async (emp) => {
        const today = new Date().toISOString().split("T")[0];
        const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const { data: certs } = await supabase
          .from("certifications")
          .select("id, expiry_date, status")
          .eq("employee_id", emp.id);

        const activeCerts = (certs || []).filter(
          (c) => c.status !== "expired" && c.expiry_date >= today
        );
        const expiringCerts = activeCerts.filter(
          (c) => c.expiry_date <= thirtyDays
        );

        return {
          ...emp,
          cert_count: activeCerts.length,
          expiring_count: expiringCerts.length,
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error("GET /api/employees error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/employees — create a new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location_id, name, role, email, phone, hire_date } = body;

    if (!location_id || !name || !role) {
      return NextResponse.json(
        { error: "location_id, name, and role are required" },
        { status: 400 }
      );
    }

    if (!["manager", "cook", "server", "host", "dishwasher"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: loc } = await supabase
      .from("locations")
      .select("organization_id")
      .eq("id", location_id)
      .single();

    const { data, error } = await supabase
      .from("employees")
      .insert({
        organization_id: loc?.organization_id,
        location_id,
        name: name.trim(),
        role,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        hire_date: hire_date || new Date().toISOString().split("T")[0],
      })
      .select("*, locations!inner(name)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/employees error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
