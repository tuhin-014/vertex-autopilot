"use client";

import { useEffect, useState } from "react";

export default function DailyFinancialsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/financials/daily?days=30").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">📅 Daily Financials</h1>
      <p className="text-gray-400">Last 30 days · {data.rows?.length || 0} entries</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800 bg-gray-900/50">
              <th className="text-left p-3">Date</th>
              <th className="text-right p-3">Revenue</th>
              <th className="text-right p-3">Food Cost</th>
              <th className="text-right p-3">Food %</th>
              <th className="text-right p-3">Labor</th>
              <th className="text-right p-3">Labor %</th>
              <th className="text-right p-3">Other</th>
              <th className="text-right p-3">Net Profit</th>
              <th className="text-right p-3">Orders</th>
              <th className="text-right p-3">Avg Ticket</th>
            </tr>
          </thead>
          <tbody>
            {(data.rows || []).map((r: any) => (
              <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-3 font-medium">{r.date}</td>
                <td className="text-right p-3 text-green-400">${Number(r.revenue).toLocaleString()}</td>
                <td className="text-right p-3 text-red-400">${Number(r.food_cost).toLocaleString()}</td>
                <td className={`text-right p-3 ${Number(r.food_cost_pct) > 35 ? "text-red-400 font-bold" : "text-gray-300"}`}>{r.food_cost_pct}%</td>
                <td className="text-right p-3 text-yellow-400">${Number(r.labor_cost).toLocaleString()}</td>
                <td className={`text-right p-3 ${Number(r.labor_cost_pct) > 35 ? "text-red-400 font-bold" : "text-gray-300"}`}>{r.labor_cost_pct}%</td>
                <td className="text-right p-3 text-gray-400">${Number(r.other_expenses).toLocaleString()}</td>
                <td className={`text-right p-3 font-semibold ${Number(r.net_profit) >= 0 ? "text-blue-400" : "text-red-400"}`}>${Number(r.net_profit).toLocaleString()}</td>
                <td className="text-right p-3 text-gray-400">{r.order_count}</td>
                <td className="text-right p-3 text-gray-400">${Number(r.avg_ticket).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
