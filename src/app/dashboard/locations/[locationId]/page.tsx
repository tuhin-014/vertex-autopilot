import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locationId: string }> };

export default async function LocationDetailPage({ params }: Props) {
  const { locationId } = await params;
  const supabase = createServiceClient();

  const { data: loc } = await supabase
    .from("va_locations")
    .select("id, name, address, city, state, manager_name, manager_email, staff_count, created_at")
    .eq("id", locationId)
    .single();

  if (!loc) notFound();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [chRes, tempRes, trRes, incRes, candRes] = await Promise.all([
    supabase
      .from("va_checklists")
      .select("id, checklist_type, completed_by, completed_at, score, items")
      .eq("location_id", locationId)
      .gte("completed_at", since7d)
      .order("completed_at", { ascending: false }),
    supabase
      .from("va_temp_logs")
      .select("id, equipment, temperature, logged_by, logged_at, in_range")
      .eq("location_id", locationId)
      .gte("logged_at", since24h)
      .order("logged_at", { ascending: false }),
    supabase
      .from("va_training")
      .select("id, employee_name, course_name, status, progress, due_date")
      .eq("location_id", locationId)
      .order("due_date", { ascending: true }),
    supabase
      .from("va_incidents")
      .select("id, type, severity, description, status, created_at")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("va_candidates")
      .select("id, name, role_applied, stage, ai_score, created_at")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const checklists = chRes.data || [];
  const temps = tempRes.data || [];
  const trainings = trRes.data || [];
  const incidents = incRes.data || [];
  const candidates = candRes.data || [];

  // Health score (same formula as Locations page)
  const todayChecklists = checklists.filter((c) => new Date(c.completed_at) >= todayStart);
  const required = ["food_safety", "opening"];
  const completedTypes = new Set(todayChecklists.map((c) => c.checklist_type));
  const missingChecklists = required.filter((t) => !completedTypes.has(t));
  const checklistScore = Math.round(((required.length - missingChecklists.length) / required.length) * 100);

  const outOfRangeCount = temps.filter((t) => !t.in_range).length;
  const tempScore = temps.length > 0 ? Math.round(((temps.length - outOfRangeCount) / temps.length) * 100) : 100;

  const trainingsCompleted = trainings.filter((t) => t.status === "completed").length;
  const trainingsOverdue = trainings.filter((t) => t.status === "overdue").length;
  const trainingScore = trainings.length > 0 ? Math.round((trainingsCompleted / trainings.length) * 100) : 100;

  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const criticalIncidents = openIncidents.filter((i) => i.severity === "critical" || i.severity === "high");

  const incidentPenalty = Math.min(20, openIncidents.length * 5);
  const healthScore = Math.max(
    0,
    Math.round(checklistScore * 0.4 + tempScore * 0.3 + trainingScore * 0.3 - incidentPenalty),
  );
  const status: "healthy" | "warning" | "critical" =
    healthScore >= 85 ? "healthy" : healthScore >= 70 ? "warning" : "critical";

  // Hiring pipeline by stage
  const stageOrder = ["applied", "screened", "interview", "offer", "hired"];
  const candidatesByStage = stageOrder.map((s) => ({
    stage: s,
    count: candidates.filter((c) => c.stage === s).length,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/locations" className="hover:text-white transition">
          Locations
        </Link>
        <span>/</span>
        <span className="text-gray-300">{loc.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{loc.name}</h1>
          <p className="text-gray-400">
            {loc.address}
            {loc.city ? `, ${loc.city}` : ""}
            {loc.state ? `, ${loc.state}` : ""}
            {loc.manager_name ? ` · Manager: ${loc.manager_name}` : ""}
          </p>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-bold ${
            status === "healthy"
              ? "bg-green-600/20 text-green-400 border border-green-600/30"
              : status === "warning"
                ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
                : "bg-red-600/20 text-red-400 border border-red-600/30"
          }`}
        >
          Health Score: {healthScore}
        </span>
      </div>

      {/* Health breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreCard label="Checklists Today" score={checklistScore} sub={`${todayChecklists.length} done · ${missingChecklists.length} missing`} />
        <ScoreCard label="Temp Compliance (24h)" score={tempScore} sub={`${temps.length} logs · ${outOfRangeCount} out of range`} />
        <ScoreCard label="Training" score={trainingScore} sub={`${trainingsCompleted}/${trainings.length} complete · ${trainingsOverdue} overdue`} />
        <ScoreCard
          label="Open Incidents"
          score={openIncidents.length === 0 ? 100 : Math.max(0, 100 - openIncidents.length * 10)}
          sub={`${openIncidents.length} open · ${criticalIncidents.length} critical`}
        />
      </div>

      {/* Active alerts */}
      {(missingChecklists.length > 0 || outOfRangeCount > 0 || criticalIncidents.length > 0) && (
        <div className="bg-red-600/5 border border-red-600/20 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-3 text-red-300">⚠️ Active Alerts</h2>
          <ul className="space-y-2 text-sm">
            {missingChecklists.map((c) => (
              <li key={c} className="text-yellow-300">
                Missing checklist today: <span className="font-semibold capitalize">{c.replace("_", " ")}</span>
              </li>
            ))}
            {temps
              .filter((t) => !t.in_range)
              .slice(0, 5)
              .map((t) => (
                <li key={t.id} className="text-red-300">
                  Out-of-range: <span className="font-semibold">{t.equipment}</span> @{" "}
                  {Number(t.temperature).toFixed(1)}°F (logged {new Date(t.logged_at).toLocaleTimeString()})
                </li>
              ))}
            {criticalIncidents.slice(0, 5).map((i) => (
              <li key={i.id} className="text-red-300">
                <span className="font-semibold capitalize">{i.severity}</span> · {i.type}: {i.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent checklists */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4 text-white">Recent Checklists</h2>
          {checklists.length === 0 && <p className="text-sm text-gray-500">No checklists in the last 7 days.</p>}
          <div className="space-y-2">
            {checklists.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white capitalize">{c.checklist_type.replace("_", " ")}</p>
                  <p className="text-xs text-gray-500">
                    {c.completed_by || "—"} · {new Date(c.completed_at).toLocaleString()}
                  </p>
                </div>
                {c.score != null && (
                  <span
                    className={`text-sm font-bold ${
                      c.score >= 90 ? "text-green-400" : c.score >= 80 ? "text-yellow-400" : "text-red-400"
                    }`}
                  >
                    {c.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Temp logs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4 text-white">Temperature Logs (24h)</h2>
          {temps.length === 0 && <p className="text-sm text-gray-500">No temp logs in the last 24h.</p>}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {temps.slice(0, 12).map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  t.in_range ? "bg-gray-800/40" : "bg-red-600/10 border border-red-600/30"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{t.equipment}</p>
                  <p className="text-xs text-gray-500">
                    {t.logged_by || "—"} · {new Date(t.logged_at).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`text-sm font-bold ${t.in_range ? "text-green-400" : "text-red-400"}`}>
                  {Number(t.temperature).toFixed(1)}°F
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring pipeline */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4 text-white">Hiring Pipeline</h2>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {candidatesByStage.map((s) => (
              <div key={s.stage} className="text-center bg-gray-800/40 rounded-lg p-2">
                <div className="text-xl font-bold text-white">{s.count}</div>
                <div className="text-[10px] uppercase text-gray-500 mt-1 capitalize">{s.stage}</div>
              </div>
            ))}
          </div>
          {candidates.length === 0 && <p className="text-sm text-gray-500">No candidates yet.</p>}
          <div className="space-y-2">
            {candidates.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {c.role_applied || "—"} · {c.stage}
                  </p>
                </div>
                {c.ai_score != null && (
                  <span
                    className={`text-xs font-bold ${
                      c.ai_score >= 80 ? "text-green-400" : c.ai_score >= 60 ? "text-yellow-400" : "text-gray-400"
                    }`}
                  >
                    AI {c.ai_score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Training */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4 text-white">Training</h2>
          {trainings.length === 0 && <p className="text-sm text-gray-500">No training assigned.</p>}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {trainings.slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-gray-800/40 rounded-lg px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{t.course_name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {t.employee_name} · due {t.due_date || "—"}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold capitalize ${
                    t.status === "completed"
                      ? "text-green-400"
                      : t.status === "overdue"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, sub }: { label: string; score: number; sub: string }) {
  const color = score >= 85 ? "text-green-400" : score >= 70 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{score}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      <div className="text-[10px] text-gray-500 mt-1">{sub}</div>
    </div>
  );
}
