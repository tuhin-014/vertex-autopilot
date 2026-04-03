"use client";

import { useState, useEffect } from "react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  par_level: number;
  storage_location: string;
}

interface CountEntry {
  item_id: string;
  counted_qty: string;
  notes: string;
}

export default function CountPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [counts, setCounts] = useState<Record<string, CountEntry>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countedBy, setCountedBy] = useState("");

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateCount = (itemId: string, field: string, value: string) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        item_id: itemId,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    const entries = Object.values(counts).filter((c) => c.counted_qty !== undefined && c.counted_qty !== "");
    if (entries.length === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/inventory/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counted_by: countedBy || "Manager",
          counts: entries.map((c) => ({
            item_id: c.item_id,
            counted_qty: parseFloat(c.counted_qty),
            notes: c.notes || null,
          })),
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit failed:", err);
    }
    setSubmitting(false);
  };

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const countedCount = Object.values(counts).filter((c) => c.counted_qty !== undefined && c.counted_qty !== "").length;

  if (loading) return <div className="text-center py-12 text-gray-400">Loading inventory...</div>;

  if (submitted) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Count Submitted!</h2>
        <p className="text-gray-400 mb-6">{countedCount} items counted and stock updated</p>
        <button
          onClick={() => { setSubmitted(false); setCounts({}); }}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
        >
          Start New Count
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Stock Count Sheet</h1>
          <p className="text-gray-400">Digital count — enter actual quantities for each item</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Counted by..."
            value={countedBy}
            onChange={(e) => setCountedBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || countedCount === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
          >
            {submitting ? "Saving..." : `Submit Count (${countedCount})`}
          </button>
        </div>
      </div>

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        return (
          <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="font-semibold capitalize">{cat}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Storage</th>
                  <th className="px-4 py-2 text-right">System Qty</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Actual Count</th>
                  <th className="px-4 py-2">Variance</th>
                  <th className="px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item) => {
                  const counted = counts[item.id]?.counted_qty;
                  const variance = counted ? parseFloat(counted) - Number(item.current_stock) : null;
                  return (
                    <tr key={item.id} className="border-b border-gray-800/50">
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-gray-400">{item.storage_location || "—"}</td>
                      <td className="px-4 py-2 text-right text-gray-400">{Number(item.current_stock).toFixed(0)}</td>
                      <td className="px-4 py-2 text-gray-400">{item.unit}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.1"
                          value={counts[item.id]?.counted_qty || ""}
                          onChange={(e) => updateCount(item.id, "counted_qty", e.target.value)}
                          placeholder="—"
                          className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        {variance !== null && (
                          <span className={variance === 0 ? "text-green-400" : variance > 0 ? "text-blue-400" : "text-red-400"}>
                            {variance > 0 ? "+" : ""}{variance.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={counts[item.id]?.notes || ""}
                          onChange={(e) => updateCount(item.id, "notes", e.target.value)}
                          placeholder="—"
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
