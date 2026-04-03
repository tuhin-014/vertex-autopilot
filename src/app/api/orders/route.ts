import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const channel = searchParams.get("channel");
  const date = searchParams.get("date");
  const locationId = searchParams.get("location_id");

  const supabase = createServiceClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (channel) query = query.eq("channel", channel);
  if (date) query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceClient();

  // Get next order number for location
  const { data: lastOrder } = await supabase
    .from("orders")
    .select("order_number")
    .eq("location_id", body.location_id)
    .order("order_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (lastOrder?.order_number || 0) + 1;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      location_id: body.location_id,
      order_number: nextNumber,
      channel: body.channel,
      status: "new",
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      items: body.items || [],
      special_instructions: body.special_instructions,
      estimated_prep_mins: body.estimated_prep_mins || 15,
      taken_by: body.taken_by || "Manual",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data }, { status: 201 });
}
