import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const supabase = createServiceClient();

  let query = supabase
    .from("order_issues")
    .select("*, orders:order_id(order_number, customer_name, total)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ issues: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("order_issues")
    .insert({
      order_id: body.order_id,
      location_id: body.location_id,
      issue_type: body.issue_type,
      description: body.description,
      resolution: body.resolution,
      refund_amount: body.refund_amount,
      reported_by: body.reported_by,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ issue: data }, { status: 201 });
}
