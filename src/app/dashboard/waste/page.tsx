"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WasteDashboard() {
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    fetch(`/api/waste/dashboard?period=${period}`).then(r => r.json()).then(setData);
  }, [period]);

  if (!data) return <div className="p-8 text-gray-400">Loading waste data...</div>;

  const reasonLabels: Record<string, string> = { expired: "🕐 Expired", spoiled: "🦠 Spoiled", overproduction: "📈 Overproduction", damaged: "💥 Damaged", dropped: "👋 Dropped", plate_waste: "🍽️ Plate Waste" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🗑️ Waste Manager</h1>
          <p className="text-gray-400">{data.totalEntries} entries · ${data.totalCost?.toFixed(2)} total waste</p>
        </div>
        <div className="flex gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Link href="/dashboard/waste/log" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">+ Log Waste</Link>
          <Link href="/dashboard/waste/reports" className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition">📊 Reports</Link>
          <Link href="/dashboard/waste/prep" className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-sm font-medium hover:bg-green-600/30 transition">🎯 Prep Targets</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">${data.totalCost?.toFixed(0)}</div>
          <div className="text-sm text-gray-400 mt-1">Total Waste Cost</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{data.totalEntries}</div>
          <div className="text-sm text-gray-400 mt-1">Waste Entries</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{data.totalQty?.toFixed(1)}</div>
          <div className="text-sm text-gray-400 mt-1">Units Wasted</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{data.topItems?.length || 0}</div>
          <div className="text-sm text-gray-400 mt-1">Unique Items</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">📂 Waste by Category</h3>
          {Object.entries(data.byCategory || {}).sort((a: any, b: any) => b[1].cost - a[1].cost).map(([cat, info]: [string, any]) => (
            <div key={cat} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
              <span className="capitalize">{cat.replace(/_/g, " ")}</span>
              <div className="text-right">
                <span className="text-red-400 font-medium">${info.cost.toFixed(2)}</span>
                <span className="text-gray-500 text-sm ml-2">({info.count}x)</span>
              </div>
            </div>
          ))}
        </div>

        {/* By Reason */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">❓ Waste by Reason</h3>
          {Object.entries(data.byReason || {}).sort((a: any, b: any) => b[1].cost - a[1].cost).map(([reason, info]: [string, any]) => (
            <div key={reason} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
              <span>{reasonLabels[reason] || reason}</span>
              <div className="text-right">
                <span className="text-red-400 font-medium">${info.cost.toFixed(2)}</span>
                <span className="text-gray-500 text-sm ml-2">({info.count}x)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Wasted Items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4">🔥 Top Wasted Items</h3>
        <div className="space-y-3">
          {(data.topItems || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-gray-500 w-6 text-right">#{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-red-400">${item.cost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(100, (item.cost / (data.topItems[0]?.cost || 1)) * 100)}%` }} />
                </div>
              </div>
              <span className="text-gray-500 text-sm">{item.count}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
