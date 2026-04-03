"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WasteLogPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ item_id: "", quantity: "", reason: "expired", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/inventory").then(r => r.json()).then(d => setItems(d.items || []));
  }, []);

  const reasons = ["expired", "spoiled", "overproduction", "damaged", "dropped", "plate_waste"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const item = items.find(i => i.id === form.item_id);
    const qty = parseFloat(form.quantity);
    const cost = qty * Number(item?.unit_cost || 0);

    await fetch("/api/waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: form.item_id,
        quantity: qty,
        unit: item?.unit || "each",
        reason: form.reason,
        estimated_cost: Math.round(cost * 100) / 100,
        logged_by: "Manager",
        location_id: item?.location_id,
      }),
    });
    setSaving(false);
    router.push("/dashboard/waste");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">🗑️ Log Waste</h1>
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Item</label>
          <select value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <option value="">Select item...</option>
            {items.map((item: any) => (
              <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Quantity</label>
          <input type="number" step="0.1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" placeholder="e.g. 3.5" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Reason</label>
          <div className="grid grid-cols-3 gap-2">
            {reasons.map(r => (
              <button key={r} type="button" onClick={() => setForm({ ...form, reason: r })} className={`px-3 py-2 rounded-lg text-sm capitalize transition ${form.reason === r ? "bg-red-600 text-white" : "bg-gray-800 border border-gray-700 hover:bg-gray-700"}`}>
                {r.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" rows={2} />
        </div>
        <button type="submit" disabled={saving} className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50">
          {saving ? "Logging..." : "Log Waste"}
        </button>
      </form>
    </div>
  );
}
