"use client";

import { useState, useEffect } from "react";

interface Analytics {
  summary: {
    total_orders: number;
    completed_orders: number;
    total_revenue: number;
    avg_ticket: number;
    cancellation_rate: number;
  };
  channel_breakdown: Record<string, { count: number; revenue: number }>;
  peak_hours: Record<string, number>;
  popular_items: { name: string; count: number }[];
  daily_totals: Record<string, { orders: number; revenue: number }>;
}

const CHANNEL_ICONS: Record<string, string> = {
  phone: "📞",
  "walk-in": "🚶",
  online: "🌐",
  ai: "🤖",
};

export default function OrderAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [days]);

  if (loading || !data) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading analytics...</div></div>;

  const { summary, channel_breakdown, peak_hours, popular_items, daily_totals } = data;

  // Find peak hour
  const peakHour = Object.entries(peak_hours).sort((a, b) => b[1] - a[1])[0];
  const maxHourOrders = peakHour ? peakHour[1] : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Order Analytics</h1>
          <p className="text-gray-400">Revenue, channels, and trends</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm">
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{summary.total_orders}</div>
          <div className="text-sm text-gray-400 mt-1">Total Orders</div>
        </div>
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">${summary.total_revenue.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Revenue</div>
        </div>
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">${summary.avg_ticket.toFixed(2)}</div>
          <div className="text-sm text-gray-400 mt-1">Avg Ticket</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{summary.completed_orders}</div>
          <div className="text-sm text-gray-400 mt-1">Completed</div>
        </div>
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{summary.cancellation_rate}%</div>
          <div className="text-sm text-gray-400 mt-1">Cancel Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-4">Revenue by Channel</h2>
          <div className="space-y-3">
            {Object.entries(channel_breakdown).sort((a, b) => b[1].revenue - a[1].revenue).map(([ch, stats]) => {
              const maxRev = Math.max(...Object.values(channel_breakdown).map((s) => s.revenue));
              const pct = maxRev > 0 ? (stats.revenue / maxRev) * 100 : 0;
              return (
                <div key={ch}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{CHANNEL_ICONS[ch] || "📋"} {ch}</span>
                    <span className="text-gray-400">{stats.count} orders · ${stats.revenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(channel_breakdown).length === 0 && <p className="text-gray-500 text-sm">No data yet</p>}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-4">Peak Hours</h2>
          <div className="space-y-2">
            {Array.from({ length: 24 }, (_, h) => `${h}:00`).filter((h) => peak_hours[h]).sort((a, b) => (peak_hours[b] || 0) - (peak_hours[a] || 0)).slice(0, 12).map((hour) => {
              const count = peak_hours[hour] || 0;
              const pct = maxHourOrders > 0 ? (count / maxHourOrders) * 100 : 0;
              return (
                <div key={hour}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-mono text-gray-300">{hour}</span>
                    <span className="text-gray-400">{count} orders</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(peak_hours).length === 0 && <p className="text-gray-500 text-sm">No data yet</p>}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-4">🔥 Popular Items</h2>
          <div className="space-y-2">
            {popular_items.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${idx < 3 ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-800 text-gray-400"}`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm text-gray-400">{item.count} sold</span>
              </div>
            ))}
            {popular_items.length === 0 && <p className="text-gray-500 text-sm">No data yet</p>}
          </div>
        </div>

        {/* Daily Revenue */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-4">Daily Revenue</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {Object.entries(daily_totals).sort((a, b) => b[0].localeCompare(a[0])).map(([day, stats]) => (
              <div key={day} className="flex items-center justify-between py-1 text-sm">
                <span className="text-gray-400 font-mono">{day}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">{stats.orders} orders</span>
                  <span className="font-medium text-green-400">${stats.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {Object.keys(daily_totals).length === 0 && <p className="text-gray-500 text-sm">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
