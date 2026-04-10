import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Loc = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  manager_name: string | null;
  staff_count: number | null;
};

type Checklist = { location_id: string; checklist_type: string };
type TempLog = { location_id: string; in_range: boolean };
type Training = { location_id: string; status: string };
type Incident = { location_id: string; status: string };

type LocHealth = {
  location: Loc;
  healthScore: number;
  status: "healthy" | "warning" | "critical";
  staff_count: number;
  outOfRangeTemps: number;
  openIncidents: number;
  missingChecklists: number;
};

function calcHealth(
  loc: Loc,
  checklists: Checklist[],
  temps: TempLog[],
  trainings: Training[],
  incidents: Incident[],
): LocHealth {
  const lc = checklists.filter((c) => c.location_id === loc.id);
  const lt = temps.filter((t) => t.location_id === loc.id);
  const ltr = trainings.filter((t) => t.location_id === loc.id);
  const li = incidents.filter((i) => i.location_id === loc.id);

  const required = ["food_safety", "opening"];
  const have = new Set(lc.map((c) => c.checklist_type));
  const missing = required.filter((t) => !have.has(t));
  const checklistScore = Math.round(((required.length - missing.length) / required.length) * 100);

  const outOfRange = lt.filter((t) => !t.in_range).length;
  const tempScore = lt.length > 0 ? Math.round(((lt.length - outOfRange) / lt.length) * 100) : 100;

  const completed = ltr.filter((t) => t.status === "completed").length;
  const trainingScore = ltr.length > 0 ? Math.round((completed / ltr.length) * 100) : 100;

  const open = li.filter((i) => i.status !== "resolved").length;
  const penalty = Math.min(20, open * 5);

  const healthScore = Math.max(
    0,
    Math.round(checklistScore * 0.4 + tempScore * 0.3 + trainingScore * 0.3 - penalty),
  );
  const status: "healthy" | "warning" | "critical" =
    healthScore >= 85 ? "healthy" : healthScore >= 70 ? "warning" : "critical";

  return {
    location: loc,
    healthScore,
    status,
    staff_count: loc.staff_count ?? 0,
    outOfRangeTemps: outOfRange,
    openIncidents: open,
    missingChecklists: missing.length,
  };
}

export default async function LocationsPage() {
  const supabase = createServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [locsRes, chRes, tRes, trRes, iRes] = await Promise.all([
    supabase.from("va_locations").select("id, name, address, city, state, manager_name, staff_count").order("name"),
    supabase.from("va_checklists").select("location_id, checklist_type").gte("completed_at", todayStart.toISOString()),
    supabase.from("va_temp_logs").select("location_id, in_range").gte("logged_at", since24h),
    supabase.from("va_training").select("location_id, status"),
    supabase.from("va_incidents").select("location_id, status"),
  ]);

  const locations: Loc[] = locsRes.data || [];
  const checklists: Checklist[] = chRes.data || [];
  const temps: TempLog[] = tRes.data || [];
  const trainings: Training[] = trRes.data || [];
  const incidents: Incident[] = iRes.data || [];

  const healthList = locations.map((l) => calcHealth(l, checklists, temps, trainings, incidents));
  healthList.sort((a, b) => a.healthScore - b.healthScore); // worst first — what an area manager wants to see

  const summary = {
    total: healthList.length,
    healthy: healthList.filter((h) => h.status === "healthy").length,
    warning: healthList.filter((h) => h.status === "warning").length,
    critical: healthList.filter((h) => h.status === "critical").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">All Locations</h1>
          <p className="text-gray-400">
            {summary.total} location{summary.total === 1 ? "" : "s"} — sorted by health (worst first)
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="px-3 py-1 bg-green-600/10 border border-green-600/30 rounded-full text-green-400">
            {summary.healthy} Healthy
          </span>
          <span className="px-3 py-1 bg-yellow-600/10 border border-yellow-600/30 rounded-full text-yellow-400">
            {summary.warning} Warning
          </span>
          <span className="px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full text-red-400">
            {summary.critical} Critical
          </span>
        </div>
      </div>

      {healthList.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No locations yet. Run the seed-demo endpoint to populate IHOP Southeast Region data.</p>
          <code className="text-xs text-blue-400 mt-2 inline-block">GET /api/seed-demo</code>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {healthList.map((h) => {
          const loc = h.location;
          const totalAlerts = h.outOfRangeTemps + h.openIncidents + h.missingChecklists;
          return (
            <Link
              key={loc.id}
              href={`/dashboard/locations/${loc.id}`}
              className={`bg-gray-900 border rounded-xl p-5 hover:bg-gray-800/50 transition ${
                h.status === "critical"
                  ? "border-red-600/50"
                  : h.status === "warning"
                    ? "border-yellow-600/50"
                    : "border-gray-800 hover:border-blue-600/40"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        h.status === "healthy"
                          ? "bg-green-400"
                          : h.status === "warning"
                            ? "bg-yellow-400"
                            : "bg-red-400 animate-pulse"
                      }`}
                    />
                    <h3 className="font-bold text-sm text-white truncate">{loc.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {loc.address}
                    {loc.city ? `, ${loc.city}` : ""}
                    {loc.state ? `, ${loc.state}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 truncate">Manager: {loc.manager_name || "—"}</p>
                </div>
                <div
                  className={`text-2xl font-bold ml-3 ${
                    h.healthScore >= 85
                      ? "text-green-400"
                      : h.healthScore >= 70
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {h.healthScore}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                <div>
                  <div className="text-gray-500">Staff</div>
                  <div className="font-bold text-gray-300">{h.staff_count}</div>
                </div>
                <div>
                  <div className="text-gray-500">Open Issues</div>
                  <div className={`font-bold ${h.openIncidents > 0 ? "text-red-400" : "text-gray-400"}`}>
                    {h.openIncidents}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Alerts</div>
                  <div
                    className={`font-bold ${
                      totalAlerts > 3 ? "text-red-400" : totalAlerts > 0 ? "text-yellow-400" : "text-gray-400"
                    }`}
                  >
                    {totalAlerts}
                  </div>
                </div>
              </div>

              {/* Health bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      h.healthScore >= 85
                        ? "bg-green-500"
                        : h.healthScore >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${h.healthScore}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
