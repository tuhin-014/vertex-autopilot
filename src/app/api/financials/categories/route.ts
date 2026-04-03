import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("expense_categories").select("*").order("name");
  return NextResponse.json({ categories: data || [] });
}

export async function POST(req: Request) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { data, error } = await supabase.from("expense_categories").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, category: data });
}