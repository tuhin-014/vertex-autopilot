import { createServerComponentClient } from "@/lib/supabase/server";

export default async function ApprovalsPage() {
  const supabase = await createServerComponentClient();
  const { data: approvals } = await supabase
    .from("approval_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const pending = approvals?.filter((a) => a.status === "pending") || [];
  const decided = approvals?.filter((a) => a.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">✅ Approval Queue</h1>
      <p className="text-gray-400">Actions requiring manager or regional approval.</p>

      {/* Pending */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">Pending ({pending.length})</h2>
        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <div>
                  <div className="font-medium">{a.action_type}</div>
                  <div className="text-sm text-gray-500">{a.agent_type} • {new Date(a.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition">✓ Approve</button>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition">✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No pending approvals. 🎉</p>
        )}
      </div>

      {/* History */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">History</h2>
        {decided.length > 0 ? (
          <div className="space-y-2">
            {decided.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-800 last:border-0">
                <div>
                  <span className={a.status === "approved" ? "text-green-400" : "text-red-400"}>
                    {a.status === "approved" ? "✓" : "✗"}
                  </span>
                  <span className="text-gray-300 ml-2">{a.action_type}</span>
                  <span className="text-gray-500 ml-2">{a.agent_type}</span>
                </div>
                <span className="text-gray-600">{a.decided_at ? new Date(a.decided_at).toLocaleString() : "—"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No approval history yet.</p>
        )}
      </div>
    </div>
  );
}
