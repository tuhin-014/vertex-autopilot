import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { orgId, locationId, name, phone, email } = body;

  if (!orgId || !locationId || !name) return NextResponse.json({ error: "orgId, locationId, and name required" }, { status: 400 });

  const supabase = createServiceClient();

  // Add employee
  const { data: emp } = await supabase.from("employees").insert({
    organization_id: orgId,
    location_id: locationId,
    name, role: "manager", phone, email,
    hire_date: new Date().toISOString().split("T")[0],
  }).select("id").single();

  // Set notification preferences
  await supabase.from("notification_preferences").insert({
    location_id: locationId,
    contact_name: name,
    contact_role: "manager",
    phone, email,
    receive_critical: true,
    receive_warning: true,
    receive_info: false,
    receive_daily_summary: true,
  });

  // Update location manager_name
  await supabase.from("locations").update({ manager_name: name, phone }).eq("id", locationId);

  return NextResponse.json({ success: true, employeeId: emp?.id });
}
