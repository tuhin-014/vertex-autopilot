"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface Approval {
  id: string;
  agent_type: string;
  action_type: string;
  location_id: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  created_at: string;
  decided_at: string | null;
}

function getActionIcon(type: string): string {
  const icons: Record<string, string> = {
    purchase_order: '📦', hire_candidate: '👤', schedule_interview: '📅',
    corrective_action: '⚠️', price_change: '💲', campaign: '📢',
    expense: '💳', waste_alert: '🗑️', maintenance: '🔧',
  };
  return icons[type] || '📋';
}

function formatActionType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getAgentColor(agent: string): string {
  const colors: Record<string, string> = {
    inventory: 'bg-blue-600/20 text-blue-400',
    hiring: 'bg-purple-600/20 text-purple-400',
    food_safety: 'bg-red-600/20 text-red-400',
    invoice: 'bg-yellow-600/20 text-yellow-400',
    marketing: 'bg-green-600/20 text-green-400',
    waste: 'bg-orange-600/20 text-orange-400',
    accountant: 'bg-cyan-600/20 text-cyan-400',
  };
  return colors[agent] || 'bg-gray-600/20 text-gray-400';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PayloadDetails({ payload, actionType }: { payload: Record<string, any>; actionType: string }) {
  if (actionType === 'purchase_order') {
    return (
      <div className="mt-2 bg-gray-900/50 rounded-lg p-3 space-y-1">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Vendor:</span>
          <span className="text-white font-medium">{String(payload.vendor || 'Unknown')}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Items:</span>
          <span className="text-white">{String(payload.item_count || '?')} items</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Estimated Total:</span>
          <span className="text-green-400 font-bold text-base">${Number(payload.total_estimated || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

      </div>
    );
  }

  if (actionType === 'hire_candidate' || actionType === 'schedule_interview') {
    return (
      <div className="mt-2 bg-gray-900/50 rounded-lg p-3 space-y-1">
        {payload.candidate_name && <div className="text-sm"><span className="text-gray-400">Candidate:</span> <span className="text-white font-medium">{String(payload.candidate_name)}</span></div>}
        {payload.role && <div className="text-sm"><span className="text-gray-400">Role:</span> <span className="text-white">{String(payload.role)}</span></div>}
        {payload.ai_score && <div className="text-sm"><span className="text-gray-400">AI Score:</span> <span className="text-yellow-400 font-bold">{String(payload.ai_score)}/10</span></div>}
        {payload.pay_rate && <div className="text-sm"><span className="text-gray-400">Pay:</span> <span className="text-green-400">${String(payload.pay_rate)}/hr</span></div>}
      </div>
    );
  }

  if (actionType === 'corrective_action') {
    return (
      <div className="mt-2 bg-gray-900/50 rounded-lg p-3 space-y-1">
        {payload.issue && <div className="text-sm"><span className="text-gray-400">Issue:</span> <span className="text-red-400">{String(payload.issue)}</span></div>}
        {payload.equipment && <div className="text-sm"><span className="text-gray-400">Equipment:</span> <span className="text-white">{String(payload.equipment)}</span></div>}
        {payload.temperature && <div className="text-sm"><span className="text-gray-400">Temp:</span> <span className="text-red-400 font-bold">{String(payload.temperature)}°F</span></div>}
      </div>
    );
  }

  // Generic fallback — show all payload keys
  const keys = Object.keys(payload).filter(k => !k.endsWith('_id') && k !== 'id');
  if (keys.length === 0) return null;
  return (
    <div className="mt-2 bg-gray-900/50 rounded-lg p-3 space-y-1">
      {keys.map(k => (
        <div key={k} className="text-sm">
          <span className="text-gray-400">{k.replace(/_/g, ' ')}:</span>{' '}
          <span className="text-white">{typeof payload[k] === 'object' ? JSON.stringify(payload[k]) : String(payload[k])}</span>
        </div>
      ))}
    </div>
  );
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
              <div key={a.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getActionIcon(a.action_type)}</span>
                    <div className="font-medium">{formatActionType(a.action_type)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded ${getAgentColor(a.agent_type)}`}>{a.agent_type}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                  {a.payload && <PayloadDetails payload={a.payload} actionType={a.action_type} />}
                </div>
                <div className="flex gap-2 shrink-0 self-start">
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
                    <span className="text-gray-300 font-medium">{getActionIcon(a.action_type)} {formatActionType(a.action_type)}</span>
                    <span className={`text-xs ml-2 px-2 py-0.5 rounded ${getAgentColor(a.agent_type)}`}>{a.agent_type}</span>
                    {a.payload?.vendor && <span className="text-gray-400 ml-2">— {String(a.payload.vendor)}</span>}
                    {a.payload?.candidate_name && <span className="text-gray-400 ml-2">— {String(a.payload.candidate_name)}</span>}
                    {a.payload?.total_estimated && <span className="text-green-400 ml-2 font-medium">${Number(a.payload.total_estimated).toFixed(2)}</span>}
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
