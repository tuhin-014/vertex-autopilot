"use client";

import { useState, useEffect } from "react";

interface Issue {
  id: string;
  issue_type: string;
  description: string;
  resolution: string | null;
  refund_amount: number | null;
  reported_by: string;
  created_at: string;
  orders: { order_number: number; customer_name: string; total: number } | null;
}

const ISSUE_COLORS: Record<string, string> = {
  wrong_item: "bg-red-500/20 text-red-400",
  missing_item: "bg-orange-500/20 text-orange-400",
  late_delivery: "bg-yellow-500/20 text-yellow-400",
  quality: "bg-purple-500/20 text-purple-400",
  overcharge: "bg-blue-500/20 text-blue-400",
  other: "bg-gray-500/20 text-gray-400",
};

export default function OrderIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/issues")
      .then((r) => r.json())
      .then((d) => { setIssues(d.issues || []); setLoading(false); });
  }, []);

  const totalIssues = issues.length;
  const totalRefunds = issues.reduce((s, i) => s + Number(i.refund_amount || 0), 0);
  const resolved = issues.filter((i) => i.resolution).length;
  const byType: Record<string, number> = {};
  for (const i of issues) { byType[i.issue_type] = (byType[i.issue_type] || 0) + 1; }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading issues...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⚠️ Order Issues</h1>
        <p className="text-gray-400">Track problems and accuracy rate</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{totalIssues}</div>
          <div className="text-sm text-gray-400 mt-1">Total Issues</div>
        </div>
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{resolved}</div>
          <div className="text-sm text-gray-400 mt-1">Resolved</div>
        </div>
        <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">{totalIssues - resolved}</div>
          <div className="text-sm text-gray-400 mt-1">Open</div>
        </div>
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">${totalRefunds.toFixed(2)}</div>
          <div className="text-sm text-gray-400 mt-1">Total Refunds</div>
        </div>
      </div>

      {/* Issue type breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="font-semibold mb-3">Issue Breakdown</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <span key={type} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${ISSUE_COLORS[type] || "bg-gray-500/20 text-gray-400"}`}>
              {type.replace(/_/g, " ")} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* Issues list */}
      {issues.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No issues reported yet. 🎉</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Resolution</th>
                <th className="px-4 py-3 text-right">Refund</th>
                <th className="px-4 py-3">Reported By</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    {issue.orders ? (
                      <div>
                        <div className="font-mono">#{issue.orders.order_number}</div>
                        <div className="text-xs text-gray-500">{issue.orders.customer_name}</div>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${ISSUE_COLORS[issue.issue_type] || "bg-gray-500/20 text-gray-400"}`}>
                      {issue.issue_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-[250px] truncate">{issue.description}</td>
                  <td className="px-4 py-3">
                    {issue.resolution ? (
                      <span className="text-green-400 text-xs">{issue.resolution}</span>
                    ) : (
                      <span className="text-yellow-400 text-xs">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{issue.refund_amount ? `$${Number(issue.refund_amount).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{issue.reported_by}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(issue.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
