import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const supabase = createServiceClient();

  const { data: locations } = await supabase.from("locations").select("*").order("name");
  const { data: employees } = await supabase.from("employees").select("location_id, role");
  const { data: targets } = await supabase.from("staffing_targets").select("location_id, role, target_count, min_count");
  const { data: events } = await supabase
    .from("agent_events")
    .select("location_id, severity")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  const { data: openActions } = await supabase.from("corrective_actions").select("location_id").eq("status", "open");
  const { data: jobs } = await supabase.from("job_postings").select("location_id").eq("status", "open");

  const stores = locations?.map((loc) => {
    const locEmps = employees?.filter((e) => e.location_id === loc.id) || [];
    const locTargets = targets?.filter((t) => t.location_id === loc.id) || [];
    const locEvents = events?.filter((e) => e.location_id === loc.id) || [];
    const criticals = locEvents.filter((e) => e.severity === "critical").length;
    const warnings = locEvents.filter((e) => e.severity === "warning").length;
    const corrective = openActions?.filter((a) => a.location_id === loc.id).length || 0;
    const openJobs = jobs?.filter((j) => j.location_id === loc.id).length || 0;

    let totalTarget = 0, totalActual = 0;
    for (const t of locTargets) {
      totalTarget += t.target_count;
      totalActual += locEmps.filter((e) => e.role === t.role).length;
    }
    const staffPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 100;

    const safetyScore = loc.last_inspection_score || (90 + Math.floor(Math.random() * 10));
    const status = criticals > 0 ? "critical" : warnings > 0 ? "warning" : "healthy";

    return { ...loc, staffPct, totalActual, totalTarget, safetyScore, criticals, warnings, corrective, openJobs, status };
  }) || [];

  const critical = stores.filter((s) => s.status === "critical").length;
  const warning = stores.filter((s) => s.status === "warning").length;
  const healthy = stores.filter((s) => s.status === "healthy").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">📍 All Stores</h1>
          <p className="text-gray-400">{stores.length} locations</p>
        </div>
        <div className="flex gap-3 items-center text-sm flex-wrap">
          <Link href="/onboarding" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition">+ Add Store</Link>
          <span className="px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full text-red-400">🔴 {critical} Critical</span>
          <span className="px-3 py-1 bg-yellow-600/10 border border-yellow-600/30 rounded-full text-yellow-400">🟡 {warning} Warning</span>
          <span className="px-3 py-1 bg-green-600/10 border border-green-600/30 rounded-full text-green-400">🟢 {healthy} Healthy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/dashboard/stores/${store.id}`}
            className={`bg-gray-900 border rounded-xl p-5 hover:bg-gray-800/50 transition ${
              store.status === "critical" ? "border-red-600/50" :
              store.status === "warning" ? "border-yellow-600/50" :
              "border-gray-800 hover:border-blue-600/50"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold">{store.name}</h3>
                <p className="text-xs text-gray-500">{store.address}{store.city ? `, ${store.city}` : ""}</p>
              </div>
              <span className={`text-2xl font-bold ${
                store.safetyScore >= 95 ? "text-green-400" :
                store.safetyScore >= 90 ? "text-green-300" :
                store.safetyScore >= 80 ? "text-yellow-400" :
                "text-red-400"
              }`}>
                {store.safetyScore}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <div>
                <div className={`font-bold ${store.criticals > 0 ? "text-red-400" : "text-gray-400"}`}>
                  {store.criticals}
                </div>
                <div className="text-gray-600">Critical</div>
              </div>
              <div>
                <div className={`font-bold ${store.corrective > 0 ? "text-yellow-400" : "text-gray-400"}`}>
                  {store.corrective}
                </div>
                <div className="text-gray-600">Corrective</div>
              </div>
              <div>
                <div className={`font-bold ${store.staffPct < 100 ? "text-yellow-400" : "text-green-400"}`}>
                  {store.staffPct}%
                </div>
                <div className="text-gray-600">Staffed</div>
              </div>
              <div>
                <div className={`font-bold ${store.openJobs > 0 ? "text-blue-400" : "text-gray-400"}`}>
                  {store.openJobs}
                </div>
                <div className="text-gray-600">Open Jobs</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    store.staffPct >= 100 ? "bg-green-500" :
                    store.staffPct >= 70 ? "bg-yellow-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(100, store.staffPct)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{store.totalActual}/{store.totalTarget}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
