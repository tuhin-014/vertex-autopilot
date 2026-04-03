import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("financial_reports").select("*").order("created_at", { ascending: false }).limit(20);
  return NextResponse.json({ reports: data || [] });
}

export async function POST(req: Request) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { data, error } = await supabase.from("financial_reports").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, report: data });
}