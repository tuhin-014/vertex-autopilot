"use client";

import { useEffect, useState } from "react";

export default function FinancialReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/financials/reports").then(r => r.json()).then(d => { setReports(d.reports || []); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Financial Reports</h1>
        <p className="text-gray-400">P&L summaries and tax reports</p>
      </div>

      <div className="grid gap-4">
        {reports.map((r: any) => (
          <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold capitalize">{r.report_type.replace(/_/g, " ")}</h3>
                <p className="text-sm text-gray-500">{r.period_start} → {r.period_end}</p>
              </div>
              <span className="px-3 py-1 bg-gray-800 rounded-full text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.data && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                {[
                  { label: "Revenue", value: `$${Number(r.data.revenue).toLocaleString()}`, color: "text-green-400" },
                  { label: "Food Cost", value: `${r.data.food_pct}%`, color: "text-red-400" },
                  { label: "Labor Cost", value: `${r.data.labor_pct}%`, color: "text-yellow-400" },
                  { label: "Other", value: `$${Number(r.data.other || 0).toLocaleString()}`, color: "text-gray-400" },
                  { label: "Net Profit", value: `$${Number(r.data.net_profit).toLocaleString()}`, color: Number(r.data.net_profit) >= 0 ? "text-blue-400" : "text-red-400" },
                ].map(m => (
                  <div key={m.label} className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
            {r.alerts && r.alerts.length > 0 && (
              <div className="space-y-1">
                {r.alerts.map((a: any, i: number) => (
                  <div key={i} className={`text-sm px-3 py-1 rounded ${a.severity === "critical" ? "bg-red-900/30 text-red-400" : "bg-blue-900/30 text-blue-400"}`}>⚠️ {a.message}</div>
                ))}
              </div>
            )}
          </div>
        ))}
        {reports.length === 0 && <div className="text-center py-12 text-gray-500">No reports generated yet. The accountant agent generates them automatically.</div>}
      </div>
    </div>
  );
}
