"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FinancialsPage() {
  const [data, setData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    fetch(`/api/financials/daily?days=${period === "week" ? 7 : 30}`).then(r => r.json()).then(setData);
    fetch(`/api/financials/summary?period=${period}`).then(r => r.json()).then(setSummary);
  }, [period]);

  if (!data) return <div className="p-8 text-gray-400">Loading financials...</div>;

  const s = data.summary || {};
  const ch = summary?.change || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💵 Financial Dashboard</h1>
          <p className="text-gray-400">P&L overview · {s.totalOrders || 0} orders</p>
        </div>
        <div className="flex gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Link href="/dashboard/financials/expenses" className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition">💳 Expenses</Link>
          <Link href="/dashboard/financials/reports" className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition">📊 Reports</Link>
          <Link href="/dashboard/financials/forecast" className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">🔮 Forecast</Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">${(s.totalRevenue || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Revenue</div>
          {ch.revenue_pct !== undefined && <div className={`text-xs mt-1 ${ch.revenue_pct >= 0 ? "text-green-400" : "text-red-400"}`}>{ch.revenue_pct >= 0 ? "↑" : "↓"} {Math.abs(ch.revenue_pct)}% vs prev</div>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">${(s.totalProfit || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Net Profit</div>
          {ch.profit_pct !== undefined && <div className={`text-xs mt-1 ${ch.profit_pct >= 0 ? "text-green-400" : "text-red-400"}`}>{ch.profit_pct >= 0 ? "↑" : "↓"} {Math.abs(ch.profit_pct)}% vs prev</div>}
        </div>
        <div className={`bg-gray-900 border rounded-xl p-4 text-center ${s.avgFoodPct > 35 ? "border-red-500/50" : "border-gray-800"}`}>
          <div className={`text-3xl font-bold ${s.avgFoodPct > 35 ? "text-red-400" : s.avgFoodPct > 30 ? "text-yellow-400" : "text-green-400"}`}>{s.avgFoodPct || 0}%</div>
          <div className="text-sm text-gray-400 mt-1">Food Cost</div>
          <div className="text-xs text-gray-600">Target: &lt;35%</div>
        </div>
        <div className={`bg-gray-900 border rounded-xl p-4 text-center ${s.avgLaborPct > 35 ? "border-red-500/50" : "border-gray-800"}`}>
          <div className={`text-3xl font-bold ${s.avgLaborPct > 35 ? "text-red-400" : s.avgLaborPct > 30 ? "text-yellow-400" : "text-green-400"}`}>{s.avgLaborPct || 0}%</div>
          <div className="text-sm text-gray-400 mt-1">Labor Cost</div>
          <div className="text-xs text-gray-600">Target: &lt;35%</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">${(s.avgDailyRevenue || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Avg Daily Rev</div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">📅 Daily Breakdown</h3>
          <Link href="/dashboard/financials/daily" className="text-blue-400 text-sm hover:underline">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2">Date</th>
                <th className="text-right py-2">Revenue</th>
                <th className="text-right py-2">Food Cost</th>
                <th className="text-right py-2">Labor</th>
                <th className="text-right py-2">Profit</th>
                <th className="text-right py-2">Food %</th>
                <th className="text-right py-2">Orders</th>
              </tr>
            </thead>
            <tbody>
              {(data.rows || []).slice(0, 10).map((r: any) => (
                <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2">{r.date}</td>
                  <td className="text-right text-green-400">${Number(r.revenue).toLocaleString()}</td>
                  <td className="text-right text-red-400">${Number(r.food_cost).toLocaleString()}</td>
                  <td className="text-right text-yellow-400">${Number(r.labor_cost).toLocaleString()}</td>
                  <td className={`text-right font-medium ${Number(r.net_profit) >= 0 ? "text-blue-400" : "text-red-400"}`}>${Number(r.net_profit).toLocaleString()}</td>
                  <td className={`text-right ${Number(r.food_cost_pct) > 35 ? "text-red-400" : "text-gray-300"}`}>{r.food_cost_pct}%</td>
                  <td className="text-right text-gray-400">{r.order_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
