import { createServiceClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = createServiceClient();
  const { data: events } = await supabase
    .from("agent_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">📋 Agent Activity Log</h1>
      <p className="text-gray-400">All autonomous actions taken by Vertex Autopilot agents.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {events && events.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-3 text-gray-400">Severity</th>
                <th className="text-left p-3 text-gray-400">Agent</th>
                <th className="text-left p-3 text-gray-400">Event</th>
                <th className="text-left p-3 text-gray-400">Description</th>
                <th className="text-left p-3 text-gray-400">Action</th>
                <th className="text-left p-3 text-gray-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3">
                    {ev.severity === "critical" ? "🔴" : ev.severity === "warning" ? "🟡" : ev.severity === "info" ? "🟢" : "⚪"}
                  </td>
                  <td className="p-3 text-gray-300">{ev.agent_type}</td>
                  <td className="p-3 text-gray-300">{ev.event_type}</td>
                  <td className="p-3 text-gray-400">{ev.description}</td>
                  <td className="p-3 text-gray-500">{ev.action_taken || "—"}</td>
                  <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(ev.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p className="text-2xl mb-2">📭</p>
            <p>No agent events yet. Events will appear once cron jobs are active.</p>
          </div>
        )}
      </div>
    </div>
  );
}
