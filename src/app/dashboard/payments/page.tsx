"use client";

import { useState, useEffect, useCallback } from "react";

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  channel: string;
  status: string;
  total: number;
  payment_method: string | null;
  payment_status: string | null;
  payment_link: string | null;
  paid_at: string | null;
  tip: number;
  created_at: string;
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid" | "link_sent">("all");

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/orders?include_payment=true");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : data.orders || data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); const i = setInterval(fetchOrders, 30000); return () => clearInterval(i); }, [fetchOrders]);

  const sendPaymentLink = async (orderId: string) => {
    setSending(orderId);
    try {
      const res = await fetch("/api/payments/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Payment link sent!\n\nAmount: $${data.amount.toFixed(2)}\nSMS: ${data.sms_sent ? "Sent" : "No phone number"}\n\nLink: ${data.payment_url}`);
        fetchOrders();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      alert("Failed to create payment link");
    }
    setSending(null);
  };

  const markPaidCash = async (orderId: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status: "paid", payment_method: "cash", paid_at: new Date().toISOString() }),
    });
    fetchOrders();
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.payment_status === filter);

  const totalRevenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + (o.total || 0), 0);
  const totalTips = orders.reduce((s, o) => s + (o.tip || 0), 0);
  const unpaidCount = orders.filter(o => !o.payment_status || o.payment_status === "unpaid").length;
  const paidCount = orders.filter(o => o.payment_status === "paid").length;
  const linkSentCount = orders.filter(o => o.payment_status === "link_sent").length;

  const statusBadge = (status: string | null) => {
    switch (status) {
      case "paid": return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">✅ Paid</span>;
      case "link_sent": return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">📱 Link Sent</span>;
      case "expired": return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">⏰ Expired</span>;
      default: return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">💰 Unpaid</span>;
    }
  };

  const methodBadge = (method: string | null) => {
    switch (method) {
      case "card_online": return "💳 Card";
      case "cash": return "💵 Cash";
      case "platform": return "📱 Platform";
      default: return "—";
    }
  };

  const channelIcon = (ch: string) => ch === "phone" ? "📞" : ch === "walk-in" ? "🚶" : ch === "online" ? "💻" : ch === "doordash" ? "🚗" : ch === "ubereats" ? "🛵" : "📋";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading payments...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">💳 Payments</h1>
        <p className="text-gray-400">Track payments, send payment links, manage cash collection</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">Revenue Collected</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{paidCount}</div>
          <div className="text-xs text-gray-400 mt-1">Paid Orders</div>
        </div>
        <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{unpaidCount}</div>
          <div className="text-xs text-gray-400 mt-1">Unpaid</div>
        </div>
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{linkSentCount}</div>
          <div className="text-xs text-gray-400 mt-1">Payment Links Sent</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">${totalTips.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">Tips</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "all", label: "All Orders", count: orders.length },
          { key: "unpaid", label: "💰 Unpaid", count: unpaidCount },
          { key: "link_sent", label: "📱 Link Sent", count: linkSentCount },
          { key: "paid", label: "✅ Paid", count: paidCount },
        ] as { key: typeof filter; label: string; count: number }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f.key ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase">
              <th className="px-4 py-3 text-left">Order</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Channel</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Payment</th>
              <th className="px-4 py-3 text-center">Method</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
            ) : (
              filtered.map(order => (
                <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="px-4 py-3">
                    <div className="font-bold text-sm">#{order.order_number}</div>
                    <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{order.customer_name}</div>
                    <div className="text-xs text-gray-500">{order.customer_phone || "No phone"}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{channelIcon(order.channel)} {order.channel}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-bold text-green-400">${order.total?.toFixed(2) || "0.00"}</div>
                    {order.tip > 0 && <div className="text-xs text-purple-400">+${order.tip.toFixed(2)} tip</div>}
                  </td>
                  <td className="px-4 py-3 text-center">{statusBadge(order.payment_status)}</td>
                  <td className="px-4 py-3 text-center text-sm">{methodBadge(order.payment_method)}</td>
                  <td className="px-4 py-3 text-center">
                    {(!order.payment_status || order.payment_status === "unpaid" || order.payment_status === "expired") && (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => sendPaymentLink(order.id)}
                          disabled={sending === order.id}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-xs font-medium transition">
                          {sending === order.id ? "..." : "📱 Text Link"}
                        </button>
                        <button onClick={() => markPaidCash(order.id)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs font-medium transition">
                          💵 Cash
                        </button>
                      </div>
                    )}
                    {order.payment_status === "link_sent" && (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => sendPaymentLink(order.id)}
                          disabled={sending === order.id}
                          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 rounded text-xs font-medium transition">
                          {sending === order.id ? "..." : "🔄 Resend"}
                        </button>
                        <button onClick={() => markPaidCash(order.id)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs font-medium transition">
                          💵 Cash
                        </button>
                      </div>
                    )}
                    {order.payment_status === "paid" && order.paid_at && (
                      <div className="text-xs text-gray-500">
                        {new Date(order.paid_at).toLocaleTimeString()}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
