import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/campaigns — List campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const status = searchParams.get("status");

    const supabase = createServiceClient();

    let query = supabase
      .from("campaigns")
      .select("*, locations(name)")
      .order("created_at", { ascending: false });

    if (locationId) query = query.eq("location_id", locationId);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      draft: data?.filter(c => c.status === "draft").length || 0,
      scheduled: data?.filter(c => c.status === "scheduled").length || 0,
      active: data?.filter(c => c.status === "active").length || 0,
      completed: data?.filter(c => c.status === "completed").length || 0,
      totalReach: data?.reduce((s, c) => s + (c.reach || 0), 0) || 0,
      totalEngagement: data?.reduce((s, c) => s + (c.engagement || 0), 0) || 0,
    };

    return NextResponse.json({ campaigns: data || [], stats });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

// POST /api/campaigns — Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        location_id: body.location_id,
        name: body.name,
        type: body.type || "social",
        content: body.content,
        channel: body.channel,
        target_audience: body.target_audience,
        status: body.scheduled_at ? "scheduled" : "draft",
        scheduled_at: body.scheduled_at || null,
        budget: body.budget || null,
        metadata: body.metadata || {},
      })
      .select("*, locations(name)")
      .single();

    if (error) throw error;
    return NextResponse.json({ campaign: data });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

// PUT /api/campaigns — Update campaign (pass id in body)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const supabase = createServiceClient();

    if (!id) return NextResponse.json({ error: "Missing campaign id" }, { status: 400 });

    const { data, error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", id)
      .select("*, locations(name)")
      .single();

    if (error) throw error;
    return NextResponse.json({ campaign: data });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}
