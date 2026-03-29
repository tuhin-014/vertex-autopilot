import { createServerComponentClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: location } = await supabase.from("locations").select("*").eq("id", id).single();
  if (!location) return <div className="p-8 text-gray-400">Store not found</div>;

  // Employees
  const { data: employees } = await supabase.from("employees").select("*").eq("location_id", id).order("role");

  // Staffing targets
  const { data: targets } = await supabase.from("staffing_targets").select("*").eq("location_id", id);

  // Certs for this location's employees
  const empIds = employees?.map((e) => e.id) || [];
  const { data: certs } = empIds.length > 0
    ? await supabase.from("certifications").select("*").in("employee_id", empIds).order("expiry_date")
    : { data: [] };

  // Recent events
  const { data: events } = await supabase
    .from("agent_events")
    .select("*")
    .eq("location_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Open corrective actions
  const { data: corrective } = await supabase.from("corrective_actions").select("*").eq("location_id", id).eq("status", "open");

  // Open jobs
  const { data: jobs } = await supabase.from("job_postings").select("*").eq("location_id", id).eq("status", "open");

  // Candidates
  const { data: candidates } = await supabase.from("candidates_pipeline").select("*").eq("location_id", id).order("created_at", { ascending: false }).limit(10);

  // Recent temp logs
  const { data: tempLogs } = await supabase
    .from("temp_logs")
    .select("*")
    .eq("location_id", id)
    .order("recorded_at", { ascending: false })
    .limit(20);

  const safetyScore = location.last_inspection_score || 92;

  // Staffing summary
  const staffingSummary = targets?.map((t) => {
    const actual = employees?.filter((e) => e.role === t.role).length || 0;
    return { role: t.role, actual, target: t.target_count, min: t.min_count };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stores" className="text-gray-500 hover:text-white transition">← All Stores</Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{location.name}</h1>
          <p className="text-gray-400">{location.address}{location.city ? `, ${location.city}, ${location.state} ${location.zip}` : ""}</p>
        </div>
        <div className={`text-4xl font-bold ${safetyScore >= 90 ? "text-green-400" : safetyScore >= 80 ? "text-yellow-400" : "text-red-400"}`}>
          {safetyScore}
          <span className="text-sm text-gray-500 font-normal ml-1">safety</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{employees?.length || 0}</div>
          <div className="text-xs text-gray-500">Employees</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-400">{certs?.filter((c) => new Date(c.expiry_date) > new Date()).length || 0}</div>
          <div className="text-xs text-gray-500">Valid Certs</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-400">{certs?.filter((c) => new Date(c.expiry_date) <= new Date()).length || 0}</div>
          <div className="text-xs text-gray-500">Expired Certs</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-orange-400">{corrective?.length || 0}</div>
          <div className="text-xs text-gray-500">Open Actions</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-400">{jobs?.length || 0}</div>
          <div className="text-xs text-gray-500">Open Jobs</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-cyan-400">{candidates?.length || 0}</div>
          <div className="text-xs text-gray-500">Candidates</div>
        </div>
      </div>

      {/* Staffing + Employees */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">👥 Staffing</h2>
          <div className="space-y-3">
            {staffingSummary.map((s) => (
              <div key={s.role} className="flex items-center gap-3">
                <span className="text-sm w-24 capitalize text-gray-300">{s.role}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      s.actual < s.min ? "bg-red-500" :
                      s.actual < s.target ? "bg-yellow-500" :
                      "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(100, (s.actual / s.target) * 100)}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${
                  s.actual < s.min ? "text-red-400" :
                  s.actual < s.target ? "text-yellow-400" :
                  "text-green-400"
                }`}>
                  {s.actual}/{s.target}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">📋 Certifications</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {certs && certs.length > 0 ? certs.map((c) => {
              const daysLeft = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const emp = employees?.find((e) => e.id === c.employee_id);
              return (
                <div key={c.id} className={`flex justify-between text-sm p-2 rounded ${
                  daysLeft <= 0 ? "bg-red-600/10" : daysLeft <= 30 ? "bg-yellow-600/10" : "bg-gray-800"
                }`}>
                  <span className="text-gray-300">{emp?.name || "—"} <span className="text-gray-500">({c.cert_type || c.cert_name})</span></span>
                  <span className={`font-bold ${daysLeft <= 0 ? "text-red-400" : daysLeft <= 30 ? "text-yellow-400" : "text-green-400"}`}>
                    {daysLeft <= 0 ? `EXPIRED` : `${daysLeft}d`}
                  </span>
                </div>
              );
            }) : <p className="text-gray-500 text-sm">No certifications on file</p>}
          </div>
        </div>
      </div>

      {/* Recent Temp Logs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">🌡️ Recent Temp Logs</h2>
        {tempLogs && tempLogs.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {tempLogs.slice(0, 12).map((log) => {
              const isCold = (log.equipment || "").toLowerCase().includes("cooler") || (log.equipment || "").toLowerCase().includes("freezer");
              const isViolation = isCold ? log.temperature > 41 : log.temperature < 135;
              return (
                <div key={log.id} className={`p-2 rounded text-center text-sm ${
                  isViolation ? "bg-red-600/10 border border-red-600/30" :
                  log.status === "flagged" ? "bg-yellow-600/10 border border-yellow-600/30" :
                  "bg-gray-800"
                }`}>
                  <div className={`text-lg font-bold ${isViolation ? "text-red-400" : "text-green-400"}`}>
                    {log.temperature}°F
                  </div>
                  <div className="text-xs text-gray-500 truncate">{log.equipment}</div>
                  <div className="text-xs text-gray-600">{new Date(log.recorded_at).toLocaleTimeString()}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No temp logs recorded</p>
        )}
      </div>

      {/* Agent Activity for this store */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">🤖 Agent Activity</h2>
        {events && events.length > 0 ? (
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
                <span>{ev.severity === "critical" ? "🔴" : ev.severity === "warning" ? "🟡" : ev.severity === "info" ? "🟢" : "⚪"}</span>
                <div className="flex-1">
                  <span className="text-gray-300">{ev.description}</span>
                  {ev.action_taken && <span className="text-gray-500 ml-2">→ {ev.action_taken}</span>}
                </div>
                <span className="text-gray-600 text-xs whitespace-nowrap">{new Date(ev.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No agent activity for this store</p>
        )}
      </div>
    </div>
  );
}
