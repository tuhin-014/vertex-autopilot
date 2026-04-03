import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (body.status) {
    updateData.status = body.status;
    if (body.status === "completed") updateData.completed_at = new Date().toISOString();
    if (body.status === "cancelled") {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancel_reason = body.cancel_reason || null;
    }
  }
  if (body.items) updateData.items = body.items;
  if (body.special_instructions !== undefined) updateData.special_instructions = body.special_instructions;
  if (body.estimated_prep_mins) updateData.estimated_prep_mins = body.estimated_prep_mins;

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ order: data });
}
