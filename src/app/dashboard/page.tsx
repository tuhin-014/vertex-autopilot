import { createServerComponentClient } from "@/lib/supabase/server";
import Link from "next/link";
import AutoRefresh from "./components/AutoRefresh";

export default async function CommandCenter() {
  const supabase = await createServerComponentClient();

  const { data: locations } = await supabase.from("locations").select("id, name");
  const { data: events } = await supabase
    .from("agent_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  const { data: approvals } = await supabase
    .from("approval_queue")
    .select("*")
    .eq("status", "pending");

  // Safety stats
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const { data: expiringCerts } = await supabase
    .from("certifications")
    .select("id, expiry_date")
    .lte("expiry_date", thirtyDays.toISOString().split("T")[0]);

  const { data: openActions } = await supabase
    .from("corrective_actions")
    .select("id")
    .eq("status", "open");

  // Today's missed logs (from agent_events)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: todayMissed } = await supabase
    .from("agent_events")
    .select("id")
    .eq("event_type", "missed_log")
    .gte("created_at", todayStart.toISOString());

  // Staffing stats
  const { data: staffingTargets } = await supabase.from("staffing_targets").select("location_id, role, target_count");
  const { data: employees } = await supabase.from("employees").select("location_id, role").eq("status", "active").is("status", null);

  const locationCount = locations?.length ?? 0;
  const criticalEvents = events?.filter((e) => e.severity === "critical").length ?? 0;
  const warningEvents = events?.filter((e) => e.severity === "warning").length ?? 0;
  const healthyStores = Math.max(0, locationCount - criticalEvents - warningEvents);
  const pendingApprovals = approvals?.length ?? 0;

  const expiredCerts = expiringCerts?.filter((c) => new Date(c.expiry_date) < new Date()).length ?? 0;
  const soonCerts = expiringCerts?.filter((c) => new Date(c.expiry_date) >= new Date()).length ?? 0;
  const todayActions = events?.filter((e) => new Date(e.created_at) >= todayStart).length ?? 0;

  // Notifications sent today
  const { data: todayNotifs } = await supabase
    .from("notifications_log")
    .select("id")
    .gte("created_at", todayStart.toISOString());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regional Command Center</h1>
          <p className="text-gray-400">IHOP Southeast Region • {locationCount} Stores</p>
        </div>
        <div className="flex items-center gap-3">
          <AutoRefresh intervalMs={30000} />
          <a
            href="/api/demo/simulate"
            target="_blank"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition"
          >
            🎬 Demo
          </a>
          <a
            href="/api/agents/run-all"
            target="_blank"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition"
          >
            ▶ Run Agents
          </a>
          <div className="flex items-center gap-2 bg-green-600/10 border border-green-600/30 rounded-full px-4 py-1.5 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{criticalEvents}</div>
          <div className="text-sm text-gray-400 mt-1">Critical</div>
        </div>
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{warningEvents}</div>
          <div className="text-sm text-gray-400 mt-1">Warning</div>
        </div>
        <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{healthyStores}</div>
          <div className="text-sm text-gray-400 mt-1">Healthy</div>
        </div>
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{pendingApprovals}</div>
          <div className="text-sm text-gray-400 mt-1">Pending Approvals</div>
        </div>
        <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{todayActions}</div>
          <div className="text-sm text-gray-400 mt-1">Actions Today</div>
        </div>
      </div>

      {/* Two-column: Safety + Hiring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/safety" className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 transition">
          <h2 className="font-bold text-lg mb-4">🛡️ Food Safety</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Missed Logs Today</span>
              <span className={`font-bold ${(todayMissed?.length ?? 0) > 0 ? "text-yellow-400" : "text-green-400"}`}>
                {todayMissed?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Expired Certs</span>
              <span className={`font-bold ${expiredCerts > 0 ? "text-red-400" : "text-green-400"}`}>
                {expiredCerts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Expiring Certs (30d)</span>
              <span className={`font-bold ${soonCerts > 0 ? "text-yellow-400" : "text-green-400"}`}>
                {soonCerts}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Open Corrective Actions</span>
              <span className="text-gray-300 font-bold">{openActions?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SMS Alerts Sent Today</span>
              <span className="text-blue-400 font-bold">{todayNotifs?.length ?? 0}</span>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/hiring" className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 transition">
          <h2 className="font-bold text-lg mb-4">👥 Hiring</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Employees</span>
              <span className="text-blue-400 font-bold">{employees?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Staffing Targets</span>
              <span className="text-gray-300 font-bold">{staffingTargets?.length ?? 0} roles tracked</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Open Positions</span>
              <span className="text-gray-500 font-bold">Sprint 3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pipeline Candidates</span>
              <span className="text-gray-500 font-bold">Sprint 3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Time-to-Hire</span>
              <span className="text-gray-500 font-bold">Sprint 3</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Approval Queue */}
      {pendingApprovals > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">
            ✅ Approval Queue ({pendingApprovals} pending)
          </h2>
          <div className="space-y-2">
            {approvals?.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
              >
                <div>
                  <span className="text-sm font-medium">{a.action_type}</span>
                  <span className="text-gray-500 text-sm ml-2">{a.agent_type}</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs font-medium">
                    ✓ Approve
                  </button>
                  <button className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs font-medium">
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">📋 Recent Agent Activity</h2>
          <Link href="/dashboard/events" className="text-blue-400 text-sm hover:underline">
            View All →
          </Link>
        </div>
        {events && events.length > 0 ? (
          <div className="space-y-2">
            {events.slice(0, 10).map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-3 text-sm py-2 border-b border-gray-800 last:border-0"
              >
                <span>
                  {ev.severity === "critical"
                    ? "🔴"
                    : ev.severity === "warning"
                    ? "🟡"
                    : ev.severity === "info"
                    ? "🟢"
                    : "⚪"}
                </span>
                <div className="flex-1">
                  <span className="text-gray-300">{ev.description}</span>
                  {ev.action_taken && (
                    <span className="text-gray-500 ml-2">→ {ev.action_taken}</span>
                  )}
                </div>
                <span className="text-gray-600 text-xs whitespace-nowrap">
                  {new Date(ev.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            No agent activity yet. Click &quot;Run Agents&quot; above to trigger the Food Safety
            Autopilot.
          </p>
        )}
      </div>
    </div>
  );
}
