import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, target_count, min_count, seasonal_override } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createServiceClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (target_count !== undefined) updates.target_count = target_count;
  if (min_count !== undefined) updates.min_count = min_count;
  if (seasonal_override !== undefined) updates.seasonal_override = seasonal_override;

  const { data, error } = await supabase.from("staffing_targets").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
