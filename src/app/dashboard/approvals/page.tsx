"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface Approval {
  id: string;
  agent_type: string;
  action_type: string;
  location_id: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  decided_at: string | null;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("approval_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setApprovals(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActing(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setApprovals((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: action === "approve" ? "approved" : "rejected", decided_at: new Date().toISOString() } : a
          )
        );
      }
    } catch (err) {
      console.error("Approval action failed:", err);
    } finally {
      setActing(null);
    }
  }

  const pending = approvals.filter((a) => a.status === "pending");
  const decided = approvals.filter((a) => a.status !== "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading approvals...</div>
      </div>
    );
  }

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
                  <div className="text-sm text-gray-500">
                    {a.agent_type} • {new Date(a.created_at).toLocaleString()}
                  </div>
                  {a.payload ? (
                    <div className="text-xs text-gray-600 mt-1">
                      {a.payload.candidate_name ? <span>Candidate: {String(a.payload.candidate_name)} • </span> : null}
                      {a.payload.role ? <span>Role: {String(a.payload.role)} • </span> : null}
                      {a.payload.ai_score ? <span>AI Score: {String(a.payload.ai_score)}</span> : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(a.id, "approve")}
                    disabled={acting === a.id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {acting === a.id ? "..." : "✓ Approve"}
                  </button>
                  <button
                    onClick={() => handleAction(a.id, "reject")}
                    disabled={acting === a.id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {acting === a.id ? "..." : "✗ Reject"}
                  </button>
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
        <h2 className="font-bold text-lg mb-4">History ({decided.length})</h2>
        {decided.length > 0 ? (
          <div className="space-y-2">
            {decided.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-3 px-3 rounded-lg bg-gray-800/50 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${a.status === "approved" ? "text-green-400" : "text-red-400"}`}>
                    {a.status === "approved" ? "✓" : "✗"}
                  </span>
                  <div>
                    <span className="text-gray-300 font-medium">{a.action_type}</span>
                    <span className="text-gray-500 ml-2">{a.agent_type}</span>
                    {a.payload?.candidate_name ? (
                      <span className="text-gray-600 ml-2">— {String(a.payload.candidate_name)}</span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    a.status === "approved" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"
                  }`}>
                    {a.status}
                  </span>
                  <div className="text-gray-600 text-xs mt-1">
                    {a.decided_at ? new Date(a.decided_at).toLocaleString() : "—"}
                  </div>
                </div>
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
