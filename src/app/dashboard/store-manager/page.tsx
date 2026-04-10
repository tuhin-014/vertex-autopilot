import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ChecklistItem = { task: string; done: boolean; value?: string };

type Checklist = {
  id: string;
  checklist_type: string;
  completed_by: string | null;
  completed_at: string;
  score: number | null;
  items: ChecklistItem[] | string | null;
};

type Incident = {
  id: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
};

function parseItems(items: ChecklistItem[] | string | null): ChecklistItem[] {
  if (!items) return [];
  if (typeof items === "string") {
    try { return JSON.parse(items); } catch { return []; }
  }
  return items;
}

export default async function StoreManagerDashboard() {
  const supabase = createServiceClient();

  // Get the first location (in production this would be the manager's assigned location)
  const { data: locations } = await supabase.from("va_locations").select("*").order("name").limit(1);
  const location = locations?.[0];

  if (!location) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Store Dashboard</h1>
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-5">
          <p className="text-sm text-gray-300">
            No locations yet. Visit <a href="/api/seed-demo" className="text-blue-400 underline">/api/seed-demo</a> to populate demo data.
          </p>
        </div>
      </div>
    );
  }

  const since24h = new Date(Date.now() - 24 * 3600000).toISOString();

  const [clRes, tempRes, trRes, incRes] = await Promise.all([
    supabase.from("va_checklists").select("*").eq("location_id", location.id).gte("completed_at", since24h).order("completed_at", { ascending: false }),
    supabase.from("va_temp_logs").select("*").eq("location_id", location.id).gte("logged_at", since24h).order("logged_at", { ascending: false }),
    supabase.from("va_training").select("*").eq("location_id", location.id),
    supabase.from("va_incidents").select("*").eq("location_id", location.id).order("created_at", { ascending: false }),
  ]);

  const checklists: Checklist[] = clRes.data || [];
  const temps = tempRes.data || [];
  const trainings = trRes.data || [];
  const incidents: Incident[] = incRes.data || [];

  const requiredTypes = ["food_safety", "opening", "closing", "cleaning"];
  const completedTypes = new Set(checklists.map((c) => c.checklist_type));
  const checklistsCompleted = requiredTypes.filter((t) => completedTypes.has(t)).length;

  const tempsOutOfRange = temps.filter((t) => !t.in_range).length;
  const tempScore = temps.length > 0 ? Math.round(((temps.length - tempsOutOfRange) / temps.length) * 100) : 100;

  const trainingCompleted = trainings.filter((t) => t.status === "completed").length;
  const trainingOverdue = trainings.filter((t) => t.status === "overdue").length;
  const trainingInProgress = trainings.filter((t) => t.status === "in_progress").length;

  const openIncidents = incidents.filter((i) => i.status !== "resolved");

  // Calculate health score
  const checklistScore = Math.round((checklistsCompleted / requiredTypes.length) * 100);
  const trainingPct = trainings.length > 0 ? Math.round((trainingCompleted / trainings.length) * 100) : 100;
  const incidentPenalty = Math.min(20, openIncidents.length * 5);
  const healthScore = Math.max(0, Math.round((checklistScore * 0.4 + tempScore * 0.3 + trainingPct * 0.3) - incidentPenalty));
  const healthStatus: "healthy" | "warning" | "critical" =
    healthScore >= 85 ? "healthy" : healthScore >= 70 ? "warning" : "critical";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Store Dashboard</h1>
          <p className="text-gray-400">{location.name} - {location.city}, {location.state}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            healthStatus === "healthy" ? "bg-green-600/20 text-green-400 border border-green-600/30" :
            healthStatus === "warning" ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30" :
            "bg-red-600/20 text-red-400 border border-red-600/30"
          }`}>
            Health Score: {healthScore}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{checklistsCompleted}/{requiredTypes.length}</div>
          <div className="text-xs text-gray-400 mt-1">Checklists Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{temps.length}</div>
          <div className="text-xs text-gray-400 mt-1">Temp Logs (24h)</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${tempsOutOfRange === 0 ? "text-green-400" : "text-red-400"}`}>
            {tempsOutOfRange}
          </div>
          <div className="text-xs text-gray-400 mt-1">Temp Violations</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{trainingOverdue}</div>
          <div className="text-xs text-gray-400 mt-1">Overdue Training</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{openIncidents.length}</div>
          <div className="text-xs text-gray-400 mt-1">Open Incidents</div>
        </div>
      </div>

      {/* Two Column: Today's Checklists + Temp Log History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Today&apos;s Checklists</h2>
          <div className="space-y-2">
            {requiredTypes.map((type) => {
              const cl = checklists.find((c) => c.checklist_type === type);
              const items = cl ? parseItems(cl.items) : [];
              const doneCount = items.filter((i) => i.done).length;
              return (
                <div key={type} className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        cl ? "bg-green-600 text-white" : "bg-gray-700 text-gray-400"
                      }`}>
                        {cl ? "✓" : "·"}
                      </span>
                      <span className="text-sm font-medium capitalize">{type.replace(/_/g, " ")}</span>
                    </div>
                    {cl ? (
                      <div className="text-right">
                        <div className="text-xs text-gray-400">{cl.completed_by}</div>
                        <div className="text-xs text-gray-500">Score: {cl.score}/100 - {doneCount}/{items.length} items</div>
                      </div>
                    ) : (
                      <span className="text-xs text-yellow-400">Not started</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Recent Temperature Logs</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {temps.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">No temp logs yet today</div>
            )}
            {temps.slice(0, 12).map((t) => (
              <div key={t.id} className={`flex items-center justify-between p-2 rounded-lg ${
                t.in_range ? "bg-gray-800/50" : "bg-red-600/10 border border-red-600/30"
              }`}>
                <div>
                  <div className="text-sm font-medium">{t.equipment}</div>
                  <div className="text-xs text-gray-500">{new Date(t.logged_at).toLocaleTimeString()}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${t.in_range ? "text-green-400" : "text-red-400"}`}>
                    {t.temperature}°F
                  </div>
                  <div className="text-xs text-gray-500">{t.in_range ? "In range" : "OUT OF RANGE"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Training Status ({trainings.length})</h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-green-600/10 border border-green-600/30 rounded-lg">
              <div className="text-xl font-bold text-green-400">{trainingCompleted}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div className="text-center p-2 bg-blue-600/10 border border-blue-600/30 rounded-lg">
              <div className="text-xl font-bold text-blue-400">{trainingInProgress}</div>
              <div className="text-xs text-gray-400">In Progress</div>
            </div>
            <div className="text-center p-2 bg-red-600/10 border border-red-600/30 rounded-lg">
              <div className="text-xl font-bold text-red-400">{trainingOverdue}</div>
              <div className="text-xs text-gray-400">Overdue</div>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {trainings.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg text-sm">
                <div>
                  <div className="font-medium">{t.employee_name}</div>
                  <div className="text-xs text-gray-500">{t.course_name}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  t.status === "completed" ? "bg-green-600/20 text-green-400" :
                  t.status === "overdue" ? "bg-red-600/20 text-red-400" :
                  t.status === "in_progress" ? "bg-blue-600/20 text-blue-400" :
                  "bg-gray-700 text-gray-400"
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Open Incidents</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {openIncidents.length === 0 && (
              <div className="text-gray-500 text-sm py-4 text-center">No open incidents</div>
            )}
            {openIncidents.map((inc) => (
              <div key={inc.id} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>
                        {inc.severity === "critical" ? "🔴" :
                         inc.severity === "high" ? "🟠" :
                         inc.severity === "medium" ? "🟡" : "🟢"}
                      </span>
                      <span className="text-xs font-medium uppercase text-gray-400">{inc.type.replace(/_/g, " ")}</span>
                      <span className={`text-xs px-1.5 py-0 rounded ${
                        inc.status === "investigating" ? "bg-yellow-600/20 text-yellow-400" : "bg-red-600/20 text-red-400"
                      }`}>{inc.status}</span>
                    </div>
                    <div className="text-sm text-gray-300">{inc.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(inc.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
