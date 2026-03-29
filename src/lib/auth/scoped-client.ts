import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get scoped data for a user based on their role.
 * - admin: sees all locations in their org
 * - manager:locationId: sees only their store
 */
export async function getUserScope(userId: string): Promise<{
  orgId: string | null;
  role: string;
  locationIds: string[] | null; // null = all locations (admin)
}> {
  const { data } = await supabase
    .from("user_organizations")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!data) return { orgId: null, role: "none", locationIds: null };

  const role = data.role || "admin";
  const orgId = data.organization_id;

  // If role is manager:locationId, scope to that location
  if (role.startsWith("manager:")) {
    const locationId = role.split(":")[1];
    return { orgId, role: "manager", locationIds: [locationId] };
  }

  // Admin sees all locations in org
  if (role === "admin") {
    return { orgId, role: "admin", locationIds: null };
  }

  // Manager without specific location — sees all
  if (role === "manager") {
    return { orgId, role: "manager", locationIds: null };
  }

  return { orgId, role, locationIds: null };
}

/**
 * Get locations for a user's scope
 */
export async function getScopedLocations(userId: string) {
  const scope = await getUserScope(userId);
  if (!scope.orgId) return [];

  let query = supabase.from("locations").select("*").eq("organization_id", scope.orgId);
  if (scope.locationIds) {
    query = query.in("id", scope.locationIds);
  }

  const { data } = await query.order("name");
  return data || [];
}
