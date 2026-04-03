"use client";

import { useState, useEffect } from "react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  prep_time_mins: number;
  popular_rank: number | null;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", price: 0, description: "", prep_time_mins: 10 });

  const fetchMenu = () => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); setLoading(false); });
  };

  useEffect(() => { fetchMenu(); }, []);

  const toggleAvailability = async (item: MenuItem) => {
    await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    fetchMenu();
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch(`/api/menu/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    fetchMenu();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    await fetch(`/api/menu/${id}`, { method: "DELETE" });
    fetchMenu();
  };

  const addItem = async () => {
    if (!newItem.name) return;
    await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    setNewItem({ name: "", category: "", price: 0, description: "", prep_time_mins: 10 });
    setShowAdd(false);
    fetchMenu();
  };

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const available = items.filter((i) => i.available).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading menu...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🍽️ Menu Manager</h1>
          <p className="text-gray-400">{items.length} items · {available} available</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
          + Add Item
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4">
          <h2 className="font-semibold mb-3">New Menu Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
            <input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="Category" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
            <input type="number" step="0.01" value={newItem.price || ""} onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })} placeholder="Price" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
            <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm md:col-span-2" />
            <div className="flex gap-2">
              <button onClick={addItem} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Items by category */}
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        return (
          <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="font-semibold capitalize">{cat} ({catItems.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Prep</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    {editingId === item.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-full" />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input type="number" step="0.01" value={editForm.price || ""} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-20 text-right" />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input type="number" value={editForm.prep_time_mins || ""} onChange={(e) => setEditForm({ ...editForm, prep_time_mins: parseInt(e.target.value) || 0 })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-16 text-right" />
                        </td>
                        <td className="px-4 py-2">—</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={saveEdit} className="text-green-400 hover:text-green-300 text-xs mr-2">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white text-xs">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2">
                          <div className="font-medium">{item.name}</div>
                          {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                        </td>
                        <td className="px-4 py-2 text-right">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-gray-400">{item.prep_time_mins}m</td>
                        <td className="px-4 py-2">
                          <button onClick={() => toggleAvailability(item)} className={`px-2 py-0.5 rounded text-xs ${item.available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {item.available ? "Available" : "Unavailable"}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => { setEditingId(item.id); setEditForm(item); }} className="text-blue-400 hover:text-blue-300 text-xs mr-2">Edit</button>
                          <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500">No menu items yet. Run the seed endpoint to populate.</div>
      )}
    </div>
  );
}
