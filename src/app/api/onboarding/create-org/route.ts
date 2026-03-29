import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerComponentClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, industry } = body;

  if (!name) return NextResponse.json({ error: "Organization name required" }, { status: 400 });

  // Get current user
  const authClient = await createServerComponentClient();
  const { data: { user } } = await authClient.auth.getUser();

  const supabase = createServiceClient();

  // Check if user already has an org
  if (user) {
    const { data: existing } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ orgId: existing.organization_id, existing: true });
    }
  }

  // Create org
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({ name, plan: "pilot", owner_user_id: user?.id })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Link user
  if (user) {
    await supabase.from("user_organizations").insert({
      user_id: user.id,
      organization_id: org.id,
      role: "admin",
    });
  }

  return NextResponse.json({ orgId: org.id, industry });
}
