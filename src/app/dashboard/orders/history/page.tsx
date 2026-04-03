"use client";

import { useState, useEffect } from "react";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  channel: string;
  status: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  total: number;
  special_instructions: string;
  created_at: string;
  completed_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-orange-500/20 text-orange-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  preparing: "bg-blue-500/20 text-blue-400",
  ready: "bg-green-500/20 text-green-400",
  completed: "bg-gray-500/20 text-gray-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const CHANNEL_ICONS: Record<string, string> = {
  phone: "📞",
  "walk-in": "🚶",
  online: "🌐",
  ai: "🤖",
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (channelFilter !== "all") params.set("channel", channelFilter);
    if (dateFilter) params.set("date", dateFilter);

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); });
  }, [statusFilter, channelFilter, dateFilter]);

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📋 Order History</h1>
        <p className="text-gray-400">{orders.length} orders · ${totalRevenue.toFixed(2)} revenue</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="all">All Channels</option>
          <option value="phone">📞 Phone</option>
          <option value="walk-in">🚶 Walk-in</option>
          <option value="online">🌐 Online</option>
          <option value="ai">🤖 AI</option>
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        {dateFilter && <button onClick={() => setDateFilter("")} className="text-gray-400 hover:text-white text-sm">✕ Clear date</button>}
      </div>

      {loading ? (
        <div className="text-gray-400 animate-pulse text-center py-12">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No orders found matching your filters.</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-mono text-gray-400">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.customer_name || "Walk-in"}</div>
                    {order.customer_phone && <div className="text-xs text-gray-500">{order.customer_phone}</div>}
                  </td>
                  <td className="px-4 py-3">{CHANNEL_ICONS[order.channel] || "📋"} {order.channel}</td>
                  <td className="px-4 py-3 text-gray-400 truncate max-w-[200px]">
                    {(order.items || []).map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">${Number(order.total || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[order.status] || "bg-gray-500/20 text-gray-400"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
