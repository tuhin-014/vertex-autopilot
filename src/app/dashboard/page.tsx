import { createServerComponentClient } from "@/lib/supabase/server";

export default async function CommandCenter() {
  const supabase = await createServerComponentClient();

  const { data: locations } = await supabase.from("locations").select("*").eq("organization_id", "00000000-0000-0000-0000-000000000001");
  const { data: events } = await supabase.from("agent_events").select("*").order("created_at", { ascending: false }).limit(20);
  const { data: approvals } = await supabase.from("approval_queue").select("*").eq("status", "pending");
  const { data: staffing } = await supabase.from("staffing_targets").select("*");

  const locationCount = locations?.length ?? 0;
  const criticalEvents = events?.filter((e) => e.severity === "critical").length ?? 0;
  const warningEvents = events?.filter((e) => e.severity === "warning").length ?? 0;
  const healthyStores = locationCount - criticalEvents - warningEvents;
  const pendingApprovals = approvals?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regional Command Center</h1>
          <p className="text-gray-400">IHOP Southeast Region • {locationCount} Stores</p>
        </div>
        <div className="flex items-center gap-2 bg-green-600/10 border border-green-600/30 rounded-full px-4 py-1.5 text-green-400 text-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{criticalEvents}</div>
          <div className="text-sm text-gray-400 mt-1">Critical</div>
        </div>
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{warningEvents}</div>
          <div className="text-sm text-gray-400 mt-1">Warning</div>
        </div>
        <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{Math.max(0, healthyStores)}</div>
          <div className="text-sm text-gray-400 mt-1">Healthy</div>
        </div>
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{pendingApprovals}</div>
          <div className="text-sm text-gray-400 mt-1">Pending Approvals</div>
        </div>
      </div>

      {/* Two-column: Safety + Hiring */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">🛡️ Food Safety</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Avg Safety Score</span><span className="text-green-400 font-bold">94.2</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Missed Logs Today</span><span className="text-yellow-400 font-bold">—</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Expiring Certs (30d)</span><span className="text-yellow-400 font-bold">—</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Open Corrective Actions</span><span className="text-gray-300 font-bold">—</span></div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">👥 Hiring</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Open Positions</span><span className="text-blue-400 font-bold">—</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Pipeline Candidates</span><span className="text-blue-400 font-bold">—</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Interviews This Week</span><span className="text-gray-300 font-bold">—</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Avg Time-to-Hire</span><span className="text-gray-300 font-bold">—</span></div>
          </div>
        </div>
      </div>

      {/* Approval Queue */}
      {pendingApprovals > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">✅ Approval Queue ({pendingApprovals} pending)</h2>
          <div className="space-y-2">
            {approvals?.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div>
                  <span className="text-sm font-medium">{a.action_type}</span>
                  <span className="text-gray-500 text-sm ml-2">{a.agent_type}</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs font-medium">✓ Approve</button>
                  <button className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-medium">✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">📋 Recent Agent Activity</h2>
        {events && events.length > 0 ? (
          <div className="space-y-2">
            {events.slice(0, 10).map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
                <span>
                  {ev.severity === "critical" ? "🔴" : ev.severity === "warning" ? "🟡" : ev.severity === "info" ? "🟢" : "⚪"}
                </span>
                <div className="flex-1">
                  <span className="text-gray-300">{ev.description}</span>
                  {ev.action_taken && <span className="text-gray-500 ml-2">→ {ev.action_taken}</span>}
                </div>
                <span className="text-gray-600 text-xs whitespace-nowrap">
                  {new Date(ev.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No agent activity yet. Agents will start logging events once cron jobs are active.</p>
        )}
      </div>
    </div>
  );
}
