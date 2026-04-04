"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  type: string;
  items: unknown[] | string;
  deadline_minutes: number | null;
}

function countItems(items: unknown[] | string): number {
  if (typeof items === 'string') {
    try { return JSON.parse(items).length; } catch { return 0; }
  }
  if (Array.isArray(items)) return items.length;
  return 0;
}

interface Completion {
  id: string;
  template_id: string;
  completed_by: string;
  shift_date: string;
  shift_type: string;
  status: string;
  completion_pct: number;
  started_at: string;
  completed_at: string | null;
  checklist_templates: { name: string; type: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  incomplete: "bg-red-500/20 text-red-400",
};

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/checklists/templates").then((r) => r.json()),
      fetch("/api/checklists/history?days=1").then((r) => r.json()),
    ]).then(([tpl, hist]) => {
      setTemplates(tpl.templates || []);
      setTodayCompletions(hist.completions || []);
      setLoading(false);
    });
  }, []);

  const openingTemplates = templates.filter((t) => t.type === "opening");
  const closingTemplates = templates.filter((t) => t.type === "closing");

  const getCompletionForTemplate = (templateId: string) =>
    todayCompletions.find((c) => c.template_id === templateId);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading checklists...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">✅ Checklists</h1>
          <p className="text-gray-400">Today&apos;s opening &amp; closing status</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/checklists/start" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
            ▶ Start Checklist
          </Link>
          <Link href="/dashboard/checklists/templates" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition">
            📋 Templates
          </Link>
          <Link href="/dashboard/checklists/history" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition">
            📊 History
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{templates.length}</div>
          <div className="text-sm text-gray-400 mt-1">Templates</div>
        </div>
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{todayCompletions.filter((c) => c.status === "completed").length}</div>
          <div className="text-sm text-gray-400 mt-1">Completed Today</div>
        </div>
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{todayCompletions.filter((c) => c.status === "in_progress").length}</div>
          <div className="text-sm text-gray-400 mt-1">In Progress</div>
        </div>
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{templates.length - todayCompletions.length}</div>
          <div className="text-sm text-gray-400 mt-1">Not Started</div>
        </div>
      </div>

      {/* Opening checklists */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-semibold">🌅 Opening Checklists</h2>
        </div>
        {openingTemplates.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No opening templates configured</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {openingTemplates.map((tpl) => {
              const completion = getCompletionForTemplate(tpl.id);
              return (
                <div key={tpl.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-800/30">
                  <div>
                    <div className="font-medium">{tpl.name}</div>
                    <div className="text-xs text-gray-500">{countItems(tpl.items)} items{tpl.deadline_minutes ? ` · ${tpl.deadline_minutes}min deadline` : ""}</div>
                  </div>
                  {completion ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">{completion.completed_by}</div>
                        <div className="text-xs text-gray-500">{completion.completion_pct}% complete</div>
                      </div>
                      <Link href={`/dashboard/checklists/${completion.id}`}>
                        <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[completion.status] || "bg-gray-500/20 text-gray-400"}`}>
                          {completion.status.replace(/_/g, " ")}
                        </span>
                      </Link>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Not started</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Closing checklists */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-semibold">🌙 Closing Checklists</h2>
        </div>
        {closingTemplates.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No closing templates configured</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {closingTemplates.map((tpl) => {
              const completion = getCompletionForTemplate(tpl.id);
              return (
                <div key={tpl.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-800/30">
                  <div>
                    <div className="font-medium">{tpl.name}</div>
                    <div className="text-xs text-gray-500">{countItems(tpl.items)} items{tpl.deadline_minutes ? ` · ${tpl.deadline_minutes}min deadline` : ""}</div>
                  </div>
                  {completion ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">{completion.completed_by}</div>
                        <div className="text-xs text-gray-500">{completion.completion_pct}% complete</div>
                      </div>
                      <Link href={`/dashboard/checklists/${completion.id}`}>
                        <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[completion.status] || "bg-gray-500/20 text-gray-400"}`}>
                          {completion.status.replace(/_/g, " ")}
                        </span>
                      </Link>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">Not started</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
