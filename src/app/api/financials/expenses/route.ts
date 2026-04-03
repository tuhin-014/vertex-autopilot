import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  let query = supabase.from("expenses").select("*, expense_categories(name), vendors(name)").order("date", { ascending: false }).limit(100);
  if (category) query = query.eq("category_id", category);

  const { data } = await query;
  return NextResponse.json({ expenses: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { data, error } = await supabase.from("expenses").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, expense: data });
}
