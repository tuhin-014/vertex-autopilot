"use client";

import { useState, useEffect, useCallback } from "react";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: { name: string; quantity: number; price: number; modifications?: string[] }[];
  subtotal: number;
  total: number;
  status: string;
  special_instructions: string | null;
  channel: string;
  taken_by: string;
  created_at: string;
  updated_at: string;
  restaurant_id: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: "bg-orange-100", text: "text-orange-700", label: "🔔 New" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "⏳ Pending" },
  preparing: { bg: "bg-blue-100", text: "text-blue-700", label: "👨‍🍳 Preparing" },
  ready: { bg: "bg-green-100", text: "text-green-700", label: "✅ Ready" },
  completed: { bg: "bg-gray-100", text: "text-gray-600", label: "✓ Completed" },
  cancelled: { bg: "bg-red-100", text: "text-red-600", label: "✕ Cancelled" },
};

export default function AIOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, revenue: 0 });

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/orders");
    const json = await res.json();
    const data = json.orders;

    if (data) {
      setOrders(data);
      setStats({
        total: data.length,
        active: data.filter((o: Order) => ["new", "pending", "preparing", "ready"].includes(o.status)).length,
        completed: data.filter((o: Order) => o.status === "completed").length,
        revenue: data.filter((o: Order) => o.status === "completed").reduce((sum: number, o: Order) => sum + (o.total || 0), 0),
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
    if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus });
  };

  const filtered = orders.filter((o) => filter === "all" || o.status === filter);
  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading orders...</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">📞 AI Phone Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time orders from AI phone agent • Auto-refreshes every 15s</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Total Orders</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Active Now</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{stats.active}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Completed</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border p-4">
          <p className="text-xs text-gray-500 uppercase font-medium">Revenue</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">${stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "new", label: "🔔 New" },
          { key: "pending", label: "⏳ Pending" },
          { key: "preparing", label: "👨‍🍳 Preparing" },
          { key: "ready", label: "✅ Ready" },
          { key: "completed", label: "✓ Completed" },
          { key: "cancelled", label: "✕ Cancelled" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-gray-900 border text-gray-600 hover:bg-gray-800"
            }`}
          >
            {f.label} {f.key !== "all" && <span className="ml-1 opacity-70">({orders.filter((o) => o.status === f.key).length})</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Orders List */}
        <div className="flex-1 space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border p-12 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-bold text-white">No orders found</p>
              <p className="text-sm text-gray-500 mt-1">Orders will appear here when customers call in.</p>
            </div>
          ) : (
            filtered.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-gray-900 rounded-xl border p-4 cursor-pointer transition hover:shadow-md ${
                  selectedOrder?.id === order.id ? "ring-2 ring-blue-500 border-blue-500/30" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">#{order.order_number}</span>
                    <span className="font-semibold text-white">{order.customer_name || "Unknown"}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[order.status]?.bg || "bg-gray-100"} ${STATUS_STYLES[order.status]?.text || "text-gray-600"}`}>
                    {STATUS_STYLES[order.status]?.label || order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-500 truncate max-w-[60%]">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                  </p>
                  <div className="flex items-center gap-3 text-gray-400 text-xs shrink-0">
                    {order.total > 0 && <span className="font-medium text-gray-300">${order.total.toFixed(2)}</span>}
                    <span>{timeAgo(order.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Detail Panel (desktop) */}
        {selectedOrder && (
          <div className="hidden lg:block w-96 shrink-0">
            <div className="bg-gray-900 rounded-xl border p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Order #{selectedOrder.order_number}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>

              {/* Customer */}
              <div className="mb-4 pb-4 border-b">
                <p className="font-semibold text-white">{selectedOrder.customer_name || "Walk-in"}</p>
                {selectedOrder.customer_phone && <p className="text-sm text-gray-500">{selectedOrder.customer_phone}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>

              {/* Items */}
              <div className="mb-4 pb-4 border-b">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                        {item.modifications && item.modifications.length > 0 && (
                          <span className="text-xs text-gray-400 block ml-5">{item.modifications.join(", ")}</span>
                        )}
                      </span>
                      {item.price > 0 && <span className="text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
                {selectedOrder.total > 0 && (
                  <div className="flex justify-between text-sm font-bold mt-3 pt-2 border-t">
                    <span>Total</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedOrder.special_instructions && (
                <div className="mb-4 pb-4 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</p>
                  <p className="text-sm text-gray-300 bg-yellow-500/10 rounded-lg p-2">{selectedOrder.special_instructions}</p>
                </div>
              )}

              {/* Channel & Source */}
              <div className="mb-4 pb-4 border-b">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Source</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>{selectedOrder.channel === 'phone' ? '📞' : selectedOrder.channel === 'walk-in' ? '🚶' : selectedOrder.channel === 'online' ? '💻' : selectedOrder.channel === 'doordash' ? '🚗' : selectedOrder.channel === 'ubereats' ? '🛵' : '📋'}</span>
                  <span className="capitalize">{selectedOrder.channel}</span>
                  {selectedOrder.taken_by && <span className="text-gray-400">• {selectedOrder.taken_by}</span>}
                </div>
              </div>

              {/* Status Actions */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOrder.status !== "preparing" && selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                    <button onClick={() => updateStatus(selectedOrder.id, "preparing")} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                      👨‍🍳 Start Prep
                    </button>
                  )}
                  {selectedOrder.status !== "ready" && selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                    <button onClick={() => updateStatus(selectedOrder.id, "ready")} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">
                      ✅ Mark Ready
                    </button>
                  )}
                  {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                    <button onClick={() => updateStatus(selectedOrder.id, "completed")} className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 transition">
                      ✓ Complete
                    </button>
                  )}
                  {selectedOrder.status !== "cancelled" && selectedOrder.status !== "completed" && (
                    <button onClick={() => updateStatus(selectedOrder.id, "cancelled")} className="px-3 py-2 rounded-lg border border-red-500/30 text-red-600 text-sm font-medium hover:bg-red-500/10 transition">
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
