import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const limit = Number(searchParams.get("limit")) || 50;

  const supabase = createServiceClient();
  let query = supabase.from("audit_trail").select("*").order("created_at", { ascending: false }).limit(limit);
  if (table) query = query.eq("table_name", table);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
