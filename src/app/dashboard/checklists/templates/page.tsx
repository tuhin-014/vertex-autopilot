"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  name: string;
  type: string;
  items: string[];
  deadline_minutes: number | null;
  created_at: string;
}

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", type: "opening", items: "", deadline_minutes: 60 });

  const fetchTemplates = () => {
    fetch("/api/checklists/templates")
      .then((r) => r.json())
      .then((d) => { setTemplates(d.templates || []); setLoading(false); });
  };

  useEffect(() => { fetchTemplates(); }, []);

  const addTemplate = async () => {
    if (!newTemplate.name || !newTemplate.items.trim()) return;
    const items = newTemplate.items.split("\n").map((s) => s.trim()).filter(Boolean);
    await fetch("/api/checklists/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTemplate.name,
        type: newTemplate.type,
        items,
        deadline_minutes: newTemplate.deadline_minutes || null,
      }),
    });
    setNewTemplate({ name: "", type: "opening", items: "", deadline_minutes: 60 });
    setShowAdd(false);
    fetchTemplates();
  };

  const openingTemplates = templates.filter((t) => t.type === "opening");
  const closingTemplates = templates.filter((t) => t.type === "closing");

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading templates...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Checklist Templates</h1>
          <p className="text-gray-400">{templates.length} templates configured</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
          + New Template
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">New Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="Template name" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
            <select value={newTemplate.type} onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
              <option value="opening">🌅 Opening</option>
              <option value="closing">🌙 Closing</option>
            </select>
            <input type="number" value={newTemplate.deadline_minutes || ""} onChange={(e) => setNewTemplate({ ...newTemplate, deadline_minutes: parseInt(e.target.value) || 0 })} placeholder="Deadline (min)" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" />
          </div>
          <textarea value={newTemplate.items} onChange={(e) => setNewTemplate({ ...newTemplate, items: e.target.value })} placeholder="One item per line:&#10;Turn on ovens&#10;Check walk-in temps&#10;Stock prep stations" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" rows={5} />
          <div className="flex gap-2">
            <button onClick={addTemplate} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Create</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Opening templates */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-semibold">🌅 Opening Templates ({openingTemplates.length})</h2>
        </div>
        {openingTemplates.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No opening templates</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {openingTemplates.map((tpl) => (
              <div key={tpl.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{tpl.name}</div>
                  <div className="text-xs text-gray-500">{tpl.items.length} items{tpl.deadline_minutes ? ` · ${tpl.deadline_minutes}min` : ""}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tpl.items.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                      {typeof item === "string" ? item : (item as { task?: string }).task || JSON.stringify(item)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closing templates */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-semibold">🌙 Closing Templates ({closingTemplates.length})</h2>
        </div>
        {closingTemplates.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No closing templates</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {closingTemplates.map((tpl) => (
              <div key={tpl.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{tpl.name}</div>
                  <div className="text-xs text-gray-500">{tpl.items.length} items{tpl.deadline_minutes ? ` · ${tpl.deadline_minutes}min` : ""}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tpl.items.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                      {typeof item === "string" ? item : (item as { task?: string }).task || JSON.stringify(item)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
