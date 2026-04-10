import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Location = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  manager_name: string | null;
  staff_count: number | null;
};

type Checklist = { location_id: string; checklist_type: string; completed_at: string; score: number | null };
type TempLog = { location_id: string; equipment: string; temperature: number; logged_at: string; in_range: boolean };
type Training = { location_id: string; status: string };
type Incident = { id: string; location_id: string; type: string; severity: string; status: string; description: string; created_at: string };
type Candidate = { location_id: string; stage: string };

type LocationHealth = {
  location: Location;
  checklistScore: number;
  tempScore: number;
  trainingScore: number;
  healthScore: number;
  status: "healthy" | "warning" | "critical";
  missingChecklists: string[];
  outOfRangeTemps: number;
  overdueTraining: number;
  openIncidents: number;
};

function calcHealth(
  loc: Location,
  checklists: Checklist[],
  temps: TempLog[],
  trainings: Training[],
  incidents: Incident[]
): LocationHealth {
  const locChecklists = checklists.filter((c) => c.location_id === loc.id);
  const locTemps = temps.filter((t) => t.location_id === loc.id);
  const locTrainings = trainings.filter((t) => t.location_id === loc.id);
  const locIncidents = incidents.filter((i) => i.location_id === loc.id);

  const requiredTypes = ["food_safety", "opening"];
  const completedTypes = new Set(locChecklists.map((c) => c.checklist_type));
  const missingChecklists = requiredTypes.filter((t) => !completedTypes.has(t));
  const checklistScore = Math.round(((requiredTypes.length - missingChecklists.length) / requiredTypes.length) * 100);

  const outOfRangeTemps = locTemps.filter((t) => !t.in_range).length;
  const tempScore = locTemps.length > 0 ? Math.round(((locTemps.length - outOfRangeTemps) / locTemps.length) * 100) : 100;

  const completedTraining = locTrainings.filter((t) => t.status === "completed").length;
  const overdueTraining = locTrainings.filter((t) => t.status === "overdue").length;
  const trainingScore = locTrainings.length > 0 ? Math.round((completedTraining / locTrainings.length) * 100) : 100;

  const openIncidents = locIncidents.filter((i) => i.status !== "resolved").length;
  const incidentPenalty = Math.min(20, openIncidents * 5);

  const healthScore = Math.max(0, Math.round((checklistScore * 0.4 + tempScore * 0.3 + trainingScore * 0.3) - incidentPenalty));

  const status: "healthy" | "warning" | "critical" =
    healthScore >= 85 ? "healthy" : healthScore >= 70 ? "warning" : "critical";

  return {
    location: loc,
    checklistScore,
    tempScore,
    trainingScore,
    healthScore,
    status,
    missingChecklists,
    outOfRangeTemps,
    overdueTraining,
    openIncidents,
  };
}

export default async function AreaManagerDashboard() {
  const supabase = createServiceClient();

  const [locRes, clRes, tempRes, trRes, incRes, candRes] = await Promise.all([
    supabase.from("va_locations").select("*").order("name"),
    supabase.from("va_checklists").select("location_id, checklist_type, completed_at, score").gte("completed_at", new Date(Date.now() - 24 * 3600000).toISOString()),
    supabase.from("va_temp_logs").select("location_id, equipment, temperature, logged_at, in_range").gte("logged_at", new Date(Date.now() - 24 * 3600000).toISOString()),
    supabase.from("va_training").select("location_id, status"),
    supabase.from("va_incidents").select("*").order("created_at", { ascending: false }),
    supabase.from("va_candidates").select("location_id, stage"),
  ]);

  const locations: Location[] = locRes.data || [];
  const checklists: Checklist[] = clRes.data || [];
  const temps: TempLog[] = tempRes.data || [];
  const trainings: Training[] = trRes.data || [];
  const incidents: Incident[] = incRes.data || [];
  const candidates: Candidate[] = candRes.data || [];

  const tablesExist = !locRes.error;
  const healthScores = locations.map((l) => calcHealth(l, checklists, temps, trainings, incidents));
  const sortedByHealth = [...healthScores].sort((a, b) => b.healthScore - a.healthScore);
  const alertLocations = healthScores.filter((h) => h.status !== "healthy").sort((a, b) => a.healthScore - b.healthScore);

  const totalLocations = locations.length;
  const healthy = healthScores.filter((h) => h.status === "healthy").length;
  const warning = healthScores.filter((h) => h.status === "warning").length;
  const critical = healthScores.filter((h) => h.status === "critical").length;
  const avgHealth = totalLocations > 0 ? Math.round(healthScores.reduce((s, h) => s + h.healthScore, 0) / totalLocations) : 0;
  const totalStaff = locations.reduce((s, l) => s + (l.staff_count || 0), 0);

  const totalChecklistsToday = checklists.length;
  const totalTempLogsToday = temps.length;
  const tempViolations = temps.filter((t) => !t.in_range).length;
  const overdueTrainingTotal = trainings.filter((t) => t.status === "overdue").length;
  const completedTrainingTotal = trainings.filter((t) => t.status === "completed").length;
  const trainingCompletionPct = trainings.length > 0 ? Math.round((completedTrainingTotal / trainings.length) * 100) : 0;
  const openIncidentsTotal = incidents.filter((i) => i.status !== "resolved").length;
  const criticalIncidents = incidents.filter((i) => i.severity === "critical" && i.status !== "resolved").length;

  const candidatesByStage = {
    applied: candidates.filter((c) => c.stage === "applied").length,
    screened: candidates.filter((c) => c.stage === "screened").length,
    interview: candidates.filter((c) => c.stage === "interview").length,
    offered: candidates.filter((c) => c.stage === "offered").length,
    hired: candidates.filter((c) => c.stage === "hired").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Regional Command Center</h1>
          <p className="text-gray-400">
            {locations[0] ? `${totalLocations} locations - Area Manager View` : "Area Manager View"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-600/10 border border-green-600/30 rounded-full px-4 py-1.5 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live
          </div>
        </div>
      </div>

      {!tablesExist && (
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-5">
          <h2 className="font-bold text-yellow-400 mb-2">Setup Required</h2>
          <p className="text-sm text-gray-300 mb-2">
            The Vertex Autopilot database tables have not been created yet. Run the schema SQL in the Supabase SQL Editor, then visit <code className="bg-gray-800 px-2 py-0.5 rounded">/api/seed-demo</code> to populate demo data.
          </p>
          <p className="text-xs text-gray-500">Schema file: <code>app/supabase/autopilot-schema.sql</code></p>
        </div>
      )}

      {tablesExist && totalLocations === 0 && (
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-5">
          <h2 className="font-bold text-blue-400 mb-2">No Data Yet</h2>
          <p className="text-sm text-gray-300">
            Visit <a href="/api/seed-demo" className="text-blue-400 underline">/api/seed-demo</a> to populate demo data for the IHOP Southeast Region.
          </p>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{totalLocations}</div>
          <div className="text-xs text-gray-400 mt-1">Total Locations</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{healthy}</div>
          <div className="text-xs text-gray-400 mt-1">Healthy</div>
        </div>
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{warning}</div>
          <div className="text-xs text-gray-400 mt-1">Warning</div>
        </div>
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{critical}</div>
          <div className="text-xs text-gray-400 mt-1">Critical</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{totalChecklistsToday}</div>
          <div className="text-xs text-gray-400 mt-1">Checklists Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{avgHealth}</div>
          <div className="text-xs text-gray-400 mt-1">Avg Health Score</div>
        </div>
      </div>

      {/* Critical Alerts */}
      {alertLocations.length > 0 && (
        <div className="bg-red-600/5 border border-red-600/20 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-3 text-red-400">Locations Needing Attention</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alertLocations.map((h) => (
              <div
                key={h.location.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  h.status === "critical"
                    ? "bg-red-600/5 border-red-600/30"
                    : "bg-yellow-600/5 border-yellow-600/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg`}>
                    {h.status === "critical" ? "🔴" : "🟡"}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{h.location.name}</div>
                    <div className="text-xs text-gray-500">
                      {h.location.city}, {h.location.state} - {h.location.manager_name}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {h.missingChecklists.length > 0 && <span className="mr-2">{h.missingChecklists.length} missing checklists</span>}
                      {h.outOfRangeTemps > 0 && <span className="mr-2">{h.outOfRangeTemps} temp violations</span>}
                      {h.overdueTraining > 0 && <span className="mr-2">{h.overdueTraining} overdue training</span>}
                      {h.openIncidents > 0 && <span className="mr-2">{h.openIncidents} open incidents</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${h.healthScore < 70 ? "text-red-400" : "text-yellow-400"}`}>
                    {h.healthScore}
                  </div>
                  <div className="text-xs text-gray-500">Health</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Temp Violations</div>
          <div className="text-2xl font-bold text-red-400">{tempViolations}</div>
          <div className="text-xs text-gray-500 mt-1">{totalTempLogsToday} logs in last 24h</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overdue Training</div>
          <div className="text-2xl font-bold text-yellow-400">{overdueTrainingTotal}</div>
          <div className="text-xs text-gray-500 mt-1">{trainingCompletionPct}% completion rate</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Open Incidents</div>
          <div className="text-2xl font-bold text-orange-400">{openIncidentsTotal}</div>
          <div className="text-xs text-gray-500 mt-1">{criticalIncidents} critical</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hiring Pipeline</div>
          <div className="text-2xl font-bold text-blue-400">{candidates.length}</div>
          <div className="text-xs text-gray-500 mt-1">{candidatesByStage.hired} hired</div>
        </div>
      </div>

      {/* Hiring Pipeline Funnel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-3">Hiring Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-3 rounded-lg bg-blue-600/10 border border-blue-600/30">
            <div className="text-2xl font-bold text-blue-400">{candidatesByStage.applied}</div>
            <div className="text-xs text-gray-400 mt-1">Applied</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-600/10 border border-purple-600/30">
            <div className="text-2xl font-bold text-purple-400">{candidatesByStage.screened}</div>
            <div className="text-xs text-gray-400 mt-1">Screened</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-600/10 border border-yellow-600/30">
            <div className="text-2xl font-bold text-yellow-400">{candidatesByStage.interview}</div>
            <div className="text-xs text-gray-400 mt-1">Interview</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-600/10 border border-orange-600/30">
            <div className="text-2xl font-bold text-orange-400">{candidatesByStage.offered}</div>
            <div className="text-xs text-gray-400 mt-1">Offered</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-600/10 border border-green-600/30">
            <div className="text-2xl font-bold text-green-400">{candidatesByStage.hired}</div>
            <div className="text-xs text-gray-400 mt-1">Hired</div>
          </div>
        </div>
      </div>

      {/* Two Column: Location Rankings + Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Location Health Rankings</h2>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {sortedByHealth.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">No locations yet</div>
            )}
            {sortedByHealth.map((h, i) => (
              <div
                key={h.location.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-300" :
                    i === 2 ? "bg-orange-500/20 text-orange-400" :
                    "bg-gray-800 text-gray-500"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{h.location.name}</div>
                  <div className="text-xs text-gray-500">{h.location.city}, {h.location.state}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-bold ${h.healthScore >= 85 ? "text-green-400" : h.healthScore >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                    {h.healthScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Recent Incidents</h2>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {incidents.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">No incidents reported</div>
            )}
            {incidents.slice(0, 10).map((inc) => {
              const loc = locations.find((l) => l.id === inc.location_id);
              return (
                <div key={inc.id} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
                  <span className="mt-0.5">
                    {inc.severity === "critical" ? "🔴" :
                     inc.severity === "high" ? "🟠" :
                     inc.severity === "medium" ? "🟡" : "🟢"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-300">{inc.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{inc.type}</span>
                      {loc && <span className="text-xs text-gray-600">| {loc.name}</span>}
                      <span className={`text-xs px-1.5 py-0 rounded ${
                        inc.status === "resolved" ? "bg-green-600/20 text-green-400" :
                        inc.status === "investigating" ? "bg-yellow-600/20 text-yellow-400" :
                        "bg-red-600/20 text-red-400"
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold mb-3">Food Safety</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Checklists Done Today</span>
              <span className="font-bold text-green-400">{checklists.filter((c) => c.checklist_type === "food_safety").length}/{totalLocations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Temp Logs Today</span>
              <span className="font-bold text-blue-400">{totalTempLogsToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Temp Violations</span>
              <span className="font-bold text-red-400">{tempViolations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Open FS Incidents</span>
              <span className="font-bold text-orange-400">{incidents.filter((i) => i.type === "food_safety" && i.status !== "resolved").length}</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold mb-3">Workforce</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Staff</span>
              <span className="font-bold text-blue-400">{totalStaff}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Open Pipeline</span>
              <span className="font-bold text-purple-400">{candidates.length - candidatesByStage.hired}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hired this period</span>
              <span className="font-bold text-green-400">{candidatesByStage.hired}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Training Completion</span>
              <span className="font-bold text-cyan-400">{trainingCompletionPct}%</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/dashboard/checklists" className="block px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">View Checklists</Link>
            <Link href="/dashboard/hiring" className="block px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">Hiring Pipeline</Link>
            <a href="/api/seed-demo" className="block px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">Reseed Demo Data</a>
          </div>
        </div>
      </div>
    </div>
  );
}
