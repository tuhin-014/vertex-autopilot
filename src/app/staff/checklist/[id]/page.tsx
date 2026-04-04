"use client";

import { useState, useEffect, use } from "react";

interface ChecklistItem {
  task: string;
  completed: boolean;
  completed_at: string | null;
  photo_url: string | null;
  notes: string | null;
}

interface Completion {
  id: string;
  completed_by: string;
  shift_date: string;
  shift_type: string;
  status: string;
  items_completed: ChecklistItem[];
  completion_pct: number;
  started_at: string;
  completed_at: string | null;
  handoff_notes: string | null;
  checklist_templates: { name: string; type: string } | null;
}

export default function StaffChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [loading, setLoading] = useState(true);
  const [handoffNotes, setHandoffNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCompletion = () => {
    fetch(`/api/checklists/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCompletion(d.completion);
        setHandoffNotes(d.completion?.handoff_notes || "");
        setLoading(false);
      });
  };

  useEffect(() => { fetchCompletion(); }, [id]);

  const toggleItem = async (idx: number) => {
    if (!completion || completion.status === "completed") return;
    const updated = completion.items_completed.map((item, i) =>
      i === idx ? { ...item, completed: !item.completed, completed_at: !item.completed ? new Date().toISOString() : null } : item
    );

    // Optimistic update
    const completedCount = updated.filter(i => i.completed).length;
    const pct = updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : 0;
    setCompletion({ ...completion, items_completed: updated, completion_pct: pct });

    await fetch(`/api/checklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items_completed: updated }),
    });
  };

  const completeChecklist = async () => {
    setSaving(true);
    await fetch(`/api/checklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", handoff_notes: handoffNotes }),
    });
    setSaving(false);
    fetchCompletion();
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>;
  if (!completion) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Checklist not found</div>;

  const completedCount = completion.items_completed.filter((i) => i.completed).length;
  const totalCount = completion.items_completed.length;
  const allDone = completedCount === totalCount && totalCount > 0;
  const typeIcon = completion.checklist_templates?.type === "opening" ? "🌅" : completion.checklist_templates?.type === "closing" ? "🌙" : "🛡️";

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-8">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-50">
        <a href="/staff" className="text-gray-400 hover:text-white text-sm">← Back</a>
        <h1 className="font-bold text-lg mt-1">{typeIcon} {completion.checklist_templates?.name || "Checklist"}</h1>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{completion.completed_by} · {completion.shift_date}</span>
          {completion.status === "completed" && <span className="text-xs text-green-400 font-medium">✅ Completed</span>}
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>{completedCount}/{totalCount}</span>
            <span className={allDone ? "text-green-400 font-bold" : "text-gray-400"}>{completion.completion_pct}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full transition-all duration-300 ${allDone ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${completion.completion_pct}%` }} />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-4 space-y-2">
        {completion.items_completed.map((item, idx) => (
          <button
            key={idx}
            onClick={() => toggleItem(idx)}
            disabled={completion.status === "completed"}
            className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition active:scale-[0.98] ${
              item.completed
                ? "bg-green-500/10 border-green-500/30"
                : "bg-gray-900 border-gray-800 hover:border-gray-600"
            } ${completion.status === "completed" ? "opacity-70" : ""}`}
          >
            {/* Checkbox */}
            <div className={`w-7 h-7 rounded-lg border-2 shrink-0 flex items-center justify-center transition ${
              item.completed ? "bg-green-500 border-green-500" : "border-gray-600"
            }`}>
              {item.completed && <span className="text-white text-sm font-bold">✓</span>}
            </div>

            {/* Task */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${item.completed ? "line-through text-gray-500" : "text-white"}`}>
                {item.task}
              </div>
              {item.completed_at && (
                <div className="text-xs text-gray-600 mt-1">
                  ✅ {new Date(item.completed_at).toLocaleTimeString()}
                </div>
              )}
              {item.notes && (
                <div className="text-xs text-yellow-400 mt-1">📝 {item.notes}</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Complete section */}
      {completion.status !== "completed" && (
        <div className="px-4 space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <label className="text-xs text-gray-400 uppercase font-medium">Handoff Notes (optional)</label>
            <textarea
              value={handoffNotes}
              onChange={(e) => setHandoffNotes(e.target.value)}
              placeholder="Notes for the next shift..."
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              rows={3}
            />
          </div>
          <button
            onClick={completeChecklist}
            disabled={!allDone || saving}
            className={`w-full py-4 rounded-xl font-medium text-lg transition ${
              allDone
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {saving ? "Completing..." : allDone ? "✅ Complete Checklist" : `${totalCount - completedCount} items remaining`}
          </button>
        </div>
      )}

      {/* Completed state */}
      {completion.status === "completed" && (
        <div className="px-4">
          <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <div className="font-bold text-green-400 text-lg">Checklist Complete!</div>
            <div className="text-xs text-gray-400 mt-1">
              Completed at {completion.completed_at ? new Date(completion.completed_at).toLocaleString() : "—"}
            </div>
            {completion.handoff_notes && (
              <div className="mt-4 bg-gray-900 rounded-lg p-3 text-left">
                <div className="text-xs text-gray-400 mb-1">Handoff Notes:</div>
                <div className="text-sm">{completion.handoff_notes}</div>
              </div>
            )}
          </div>
          <a href="/staff" className="block text-center mt-4 text-blue-400 text-sm">← Back to Staff Portal</a>
        </div>
      )}
    </div>
  );
}
