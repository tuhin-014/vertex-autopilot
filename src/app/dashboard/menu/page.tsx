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
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; errors: string[] } | null>(null);

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

  const exportCSV = () => {
    const headers = ['name', 'category', 'price', 'description', 'prep_time_mins', 'available'];
    const rows = items.map(item => [
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      item.price,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.prep_time_mins || 10,
      item.available ? 'yes' : 'no',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `menu-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const downloadTemplate = () => {
    const csv = `name,category,price,description,prep_time_mins,available
"Classic Pancakes","Breakfast",9.99,"Fluffy buttermilk pancakes",12,yes
"Grilled Chicken Salad","Lunch",13.99,"Fresh greens with grilled chicken",15,yes
"Kids Mac & Cheese","Kids",6.99,"Creamy mac and cheese",8,yes`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'menu-import-template.csv';
    a.click();
  };

  const importCSV = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setImportResult({ added: 0, errors: ['File is empty or has no data rows'] });
      setImporting(false);
      return;
    }

    // Parse header
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const nameIdx = header.indexOf('name');
    const catIdx = header.indexOf('category');
    const priceIdx = header.indexOf('price');
    const descIdx = header.indexOf('description');
    const prepIdx = header.findIndex(h => h.includes('prep'));
    const availIdx = header.findIndex(h => h.includes('avail'));

    if (nameIdx === -1) {
      setImportResult({ added: 0, errors: ['CSV must have a "name" column'] });
      setImporting(false);
      return;
    }

    let added = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Parse CSV line (handle quoted fields)
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const ch of lines[i]) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      fields.push(current.trim());

      const name = fields[nameIdx];
      if (!name) { errors.push(`Row ${i + 1}: missing name`); continue; }

      const item = {
        name,
        category: catIdx >= 0 ? (fields[catIdx] || 'Other') : 'Other',
        price: priceIdx >= 0 ? parseFloat(fields[priceIdx]) || 0 : 0,
        description: descIdx >= 0 ? (fields[descIdx] || '') : '',
        prep_time_mins: prepIdx >= 0 ? parseInt(fields[prepIdx]) || 10 : 10,
        available: availIdx >= 0 ? !['no', 'false', '0', 'n'].includes((fields[availIdx] || 'yes').toLowerCase()) : true,
      };

      try {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (res.ok) added++;
        else errors.push(`Row ${i + 1} (${name}): API error`);
      } catch {
        errors.push(`Row ${i + 1} (${name}): network error`);
      }
    }

    setImportResult({ added, errors });
    setImporting(false);
    fetchMenu();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading menu...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🍽️ Menu Manager</h1>
          <p className="text-gray-400">{items.length} items · {available} available</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
            + Add Item
          </button>
          <button onClick={exportCSV} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition" title="Export menu as CSV">
            📥 Export CSV
          </button>
          <label className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition cursor-pointer" title="Import menu from CSV">
            📤 Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
          </label>
          <button onClick={downloadTemplate} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition" title="Download CSV template">
            📋 Template
          </button>
        </div>
      </div>

      {/* Import result */}
      {importing && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 text-blue-400 text-sm animate-pulse">
          ⏳ Importing menu items...
        </div>
      )}
      {importResult && (
        <div className={`border rounded-xl p-4 text-sm ${importResult.errors.length > 0 ? 'bg-yellow-600/10 border-yellow-500/30' : 'bg-green-600/10 border-green-500/30'}`}>
          <div className="font-medium">
            ✅ Imported {importResult.added} item{importResult.added !== 1 ? 's' : ''} successfully
            {importResult.errors.length > 0 && <span className="text-yellow-400 ml-2">⚠️ {importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}</span>}
          </div>
          {importResult.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {importResult.errors.map((err, i) => (
                <div key={i} className="text-xs text-red-400">• {err}</div>
              ))}
            </div>
          )}
          <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-gray-400 hover:text-white">Dismiss</button>
        </div>
      )}

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
