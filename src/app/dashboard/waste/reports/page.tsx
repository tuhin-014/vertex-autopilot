"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WasteReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/waste/reports").then(r => r.json()).then(d => { setReports(d.reports || []); setLoading(false); });
  }, []);

  const generate = async () => {
    setLoading(true);
    await fetch("/api/waste/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period: "weekly" }) });
    const d = await fetch("/api/waste/reports").then(r => r.json());
    setReports(d.reports || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Waste Reports</h1>
          <p className="text-gray-400">AI-generated waste analysis with savings suggestions</p>
        </div>
        <button onClick={generate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Generating..." : "🔄 Generate Report"}
        </button>
      </div>

      <div className="grid gap-4">
        {reports.map((r: any) => (
          <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm text-gray-500">{r.period_start} → {r.period_end}</span>
                <div className="flex gap-4 mt-2">
                  <span className="text-red-400 font-semibold">${r.total_waste_cost?.toFixed(2)} waste</span>
                  <span className="text-gray-400">{r.total_items_wasted} entries</span>
                  {r.waste_pct_of_food_cost > 0 && <span className="text-yellow-400">{r.waste_pct_of_food_cost}% of food cost</span>}
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-800 rounded-full text-xs capitalize">{r.report_type} Report</span>
            </div>

            {r.top_wasted_items && r.top_wasted_items.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm text-gray-500 mb-2">Top Wasted Items</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(r.top_wasted_items as any[]).map((item: any, i: number) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-3 text-center">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-red-400 text-sm">${item.cost?.toFixed(2)}</div>
                      <div className="text-gray-500 text-xs">{item.qty}x</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {r.suggestions && r.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm text-gray-500 mb-2">💡 AI Suggestions</h4>
                <div className="space-y-2">
                  {(r.suggestions as any[]).map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                      <span className="text-green-400">💡</span>
                      <span className="text-sm flex-1">{s.suggestion}</span>
                      {s.estimated_savings > 0 && <span className="text-green-400 text-sm font-medium">Save ${s.estimated_savings.toFixed(2)}/period</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {reports.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No reports yet. Click "Generate Report" to analyze waste data.
          </div>
        )}
      </div>
    </div>
  );
}
