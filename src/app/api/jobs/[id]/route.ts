import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const supabase = createServiceClient();
  const updates: Record<string, unknown> = { ...body };
  if (body.status === "closed") updates.closed_at = new Date().toISOString();

  const { data, error } = await supabase.from("job_postings").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
