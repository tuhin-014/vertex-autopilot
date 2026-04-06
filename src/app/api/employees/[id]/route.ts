import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/employees/[id] — single employee with certifications
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: employee, error } = await supabase
      .from("employees")
      .select("*, locations!inner(name)")
      .eq("id", id)
      .single();

    if (error || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const { data: certifications } = await supabase
      .from("certifications")
      .select("*")
      .eq("employee_id", id)
      .order("expiry_date");

    return NextResponse.json({ data: { ...employee, certifications: certifications || [] } });
  } catch (err) {
    console.error("GET /api/employees/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/employees/[id] — update employee fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, role, email, phone, location_id } = body;

    if (role && !["manager", "cook", "server", "host", "dishwasher"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Build update payload from only provided fields
    const { hire_date } = body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role;
    if (email !== undefined) updates.email = email?.trim() || null;
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (hire_date !== undefined) updates.hire_date = hire_date || null;
    if (location_id !== undefined) {
      const { data: loc } = await supabase
        .from("locations")
        .select("organization_id")
        .eq("id", location_id)
        .single();
      if (!loc) return NextResponse.json({ error: "Location not found" }, { status: 404 });
      updates.location_id = location_id;
      updates.organization_id = loc.organization_id;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select("*, locations!inner(name)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PUT /api/employees/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/employees/[id] — soft-delete by setting status = 'inactive'
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("employees")
      .update({ status: "inactive" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/employees/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
