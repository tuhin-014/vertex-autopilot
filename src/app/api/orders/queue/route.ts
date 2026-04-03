import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");

  const supabase = createServiceClient();
  let query = supabase
    .from("orders")
    .select("*")
    .in("status", ["new", "preparing", "ready"])
    .order("created_at", { ascending: true });

  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calculate wait time and estimated completion for each order
  const queue = (data || []).map((order) => {
    const createdAt = new Date(order.created_at).getTime();
    const elapsedMins = Math.floor((Date.now() - createdAt) / 60000);
    const estimatedPrep = order.estimated_prep_mins || 15;
    const waitTime = elapsedMins - estimatedPrep;
    return { ...order, elapsed_mins: elapsedMins, wait_time: waitTime };
  });

  return NextResponse.json({ queue });
}
