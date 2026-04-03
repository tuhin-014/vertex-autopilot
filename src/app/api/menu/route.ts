import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const available = searchParams.get("available");

  const supabase = createServiceClient();
  let query = supabase
    .from("menu_items")
    .select("*")
    .order("category")
    .order("popular_rank", { nullsFirst: false })
    .order("name");

  if (locationId) query = query.eq("location_id", locationId);
  if (available === "true") query = query.eq("available", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      location_id: body.location_id,
      name: body.name,
      category: body.category,
      price: body.price,
      description: body.description,
      available: body.available ?? true,
      prep_time_mins: body.prep_time_mins || 10,
      popular_rank: body.popular_rank,
      upsell_items: body.upsell_items || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
