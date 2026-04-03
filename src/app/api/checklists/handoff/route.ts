import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("checklist_completions")
    .update({ handoff_notes: body.handoff_notes })
    .eq("id", body.completion_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ completion: data });
}
