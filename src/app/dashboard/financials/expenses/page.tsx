"use client";

import { useEffect, useState } from "react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ description: "", amount: "", category_id: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/financials/expenses").then(r => r.json()),
      fetch("/api/financials/categories").then(r => r.json()),
    ]).then(([e, c]) => { setExpenses(e.expenses || []); setCategories(c.categories || []); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/financials/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const d = await fetch("/api/financials/expenses").then(r => r.json());
    setExpenses(d.expenses || []);
    setForm({ description: "", amount: "", category_id: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setSaving(false);
  };

  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const byCategory: Record<string, number> = {};
  for (const e of expenses) byCategory[e.expense_categories?.name || "Other"] = (byCategory[e.expense_categories?.name || "Other"] || 0) + Number(e.amount || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💳 Expense Manager</h1>
          <p className="text-gray-400">{expenses.length} expenses · ${totalExpenses.toFixed(2)} total</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* By Category */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">By Category</h3>
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
              <span className="text-sm">{cat}</span>
              <span className="text-purple-400 font-medium">${amt.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Add Expense Form */}
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">+ Add Expense</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" required className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" />
            <input value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Amount $" type="number" step="0.01" required className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" />
            <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} required className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
              <option value="">Category...</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={form.date} onChange={e => setForm({...form, date: e.target.value})} type="date" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2" />
            <button type="submit" disabled={saving} className="md:col-span-2 bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50">
              {saving ? "Saving..." : "Add Expense"}
            </button>
          </form>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800 bg-gray-900/50">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3">Category</th>
              <th className="text-right p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.slice(0, 30).map((e: any) => (
              <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-3 text-gray-400">{e.date}</td>
                <td className="p-3">{e.description}</td>
                <td className="p-3 text-gray-400">{e.expense_categories?.name || "—"}</td>
                <td className="text-right p-3 text-purple-400 font-medium">${Number(e.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
