import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get the organization ID for a user.
 * Returns null if user has no organization (needs onboarding).
 */
export async function getUserOrganization(userId: string): Promise<{ orgId: string; role: string } | null> {
  const { data } = await supabase
    .from("user_organizations")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!data) return null;
  return { orgId: data.organization_id, role: data.role };
}

/**
 * Create a new organization and link the user as admin.
 */
export async function createOrganization(
  userId: string,
  orgName: string,
  plan: string = "pilot"
): Promise<string> {
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, plan, owner_user_id: userId })
    .select("id")
    .single();

  if (orgError) throw new Error(`Failed to create organization: ${orgError.message}`);

  await supabase.from("user_organizations").insert({
    user_id: userId,
    organization_id: org.id,
    role: "admin",
  });

  return org.id;
}

/**
 * Add a location to an organization.
 */
export async function addLocation(
  orgId: string,
  name: string,
  address: string,
  city?: string,
  state?: string,
  zip?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("locations")
    .insert({ organization_id: orgId, name, address, city, state, zip })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to add location: ${error.message}`);
  return data.id;
}

/**
 * Add a store manager user to an organization.
 */
export async function addStoreManager(
  userId: string,
  orgId: string,
  locationId?: string
): Promise<void> {
  await supabase.from("user_organizations").insert({
    user_id: userId,
    organization_id: orgId,
    role: locationId ? `manager:${locationId}` : "manager",
  });
}
