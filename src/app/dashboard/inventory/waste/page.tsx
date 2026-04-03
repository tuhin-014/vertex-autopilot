"use client";

import { useState, useEffect } from "react";

interface WasteLog {
  id: string;
  quantity: number;
  unit: string;
  reason: string;
  estimated_cost: number;
  logged_by: string;
  logged_at: string;
  inventory_items: { name: string; category: string } | null;
}

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
}

const reasons = ["expired", "spoiled", "overproduction", "damaged", "dropped", "other"];

export default function WastePage() {
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<{ total_cost: number; by_reason: Record<string, { count: number; cost: number }> }>({ total_cost: 0, by_reason: {} });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item_id: "", quantity: "", reason: "spoiled", logged_by: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    fetch("/api/waste").then((r) => r.json()).then((data) => {
      setLogs(data.logs || []);
      setSummary(data.summary || { total_cost: 0, by_reason: {} });
    });
    fetch("/api/inventory").then((r) => r.json()).then((data) => {
      setItems(Array.isArray(data) ? data : []);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.item_id || !form.quantity) return;
    setSubmitting(true);
    await fetch("/api/waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: parseFloat(form.quantity),
      }),
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ item_id: "", quantity: "", reason: "spoiled", logged_by: "" });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🗑️ Waste Tracking</h1>
          <p className="text-gray-400">Track waste, reduce food cost, identify patterns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition"
        >
          + Log Waste
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">${summary.total_cost.toFixed(0)}</div>
          <div className="text-sm text-gray-400 mt-1">Total Waste Cost</div>
        </div>
        {Object.entries(summary.by_reason).slice(0, 3).map(([reason, data]) => (
          <div key={reason} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{data.count}</div>
            <div className="text-sm text-gray-400 mt-1 capitalize">{reason}</div>
            <div className="text-xs text-gray-500">${data.cost.toFixed(0)}</div>
          </div>
        ))}
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Log Waste Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={form.item_id}
              onChange={(e) => setForm({ ...form, item_id: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select item...</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.1"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <select
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              {submitting ? "Logging..." : "Log Waste"}
            </button>
          </div>
        </div>
      )}

      {/* Waste Log Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3">Logged By</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-400">
                  {new Date(log.logged_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-medium">
                  {log.inventory_items?.name || "Unknown"}
                </td>
                <td className="px-4 py-3 text-right">{log.quantity} {log.unit}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs capitalize">
                    {log.reason}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-red-400">
                  ${Number(log.estimated_cost || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-400">{log.logged_by}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  No waste logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
