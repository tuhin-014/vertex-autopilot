"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  location_id: string | null;
  name: string;
  type: string;
  items: string[];
  deadline_minutes: number | null;
}

export default function StartChecklistPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [completedBy, setCompletedBy] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch("/api/checklists/templates")
      .then((r) => r.json())
      .then((d) => { setTemplates(d.templates || []); setLoading(false); });
  }, []);

  const startChecklist = async () => {
    if (!selectedTemplate || !completedBy) return;
    setStarting(true);
    try {
      const res = await fetch("/api/checklists/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          location_id: selectedTemplate.location_id,
          completed_by: completedBy,
          shift_type: selectedTemplate.type,
          template_items: selectedTemplate.items,
        }),
      });
      const data = await res.json();
      if (data.completion) {
        router.push(`/dashboard/checklists/${data.completion.id}`);
      }
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading templates...</div></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">▶ Start Checklist</h1>
        <p className="text-gray-400">Select a checklist template to begin</p>
      </div>

      {/* Employee name */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <label className="text-xs text-gray-400 uppercase font-medium">Your Name</label>
        <input value={completedBy} onChange={(e) => setCompletedBy(e.target.value)} placeholder="Enter your name" className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
      </div>

      {/* Template selection */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No templates available. Create one first.</div>
        ) : (
          templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl)}
              className={`w-full text-left bg-gray-900 border rounded-xl p-4 transition ${
                selectedTemplate?.id === tpl.id
                  ? "border-blue-500 bg-blue-600/10"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{tpl.type === "opening" ? "🌅" : "🌙"} {tpl.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tpl.items.length} items · {tpl.type} checklist
                    {tpl.deadline_minutes ? ` · ${tpl.deadline_minutes}min deadline` : ""}
                  </div>
                </div>
                {selectedTemplate?.id === tpl.id && <span className="text-blue-400 text-lg">✓</span>}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Preview selected template */}
      {selectedTemplate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Preview: {selectedTemplate.name}</h2>
          <div className="space-y-1">
            {selectedTemplate.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-5 h-5 rounded border border-gray-700 shrink-0" />
                {typeof item === "string" ? item : (item as { task?: string }).task || JSON.stringify(item)}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={startChecklist}
        disabled={!selectedTemplate || !completedBy || starting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition text-lg"
      >
        {starting ? "Starting..." : "Start Checklist →"}
      </button>
    </div>
  );
}
