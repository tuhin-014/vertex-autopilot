"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

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

export default function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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

    await fetch(`/api/checklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items_completed: updated }),
    });
    fetchCompletion();
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

  const addNoteToItem = async (idx: number) => {
    if (!completion) return;
    const note = prompt("Add a note:");
    if (!note) return;
    const updated = completion.items_completed.map((item, i) =>
      i === idx ? { ...item, notes: note } : item
    );
    await fetch(`/api/checklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items_completed: updated }),
    });
    fetchCompletion();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading checklist...</div></div>;
  if (!completion) return <div className="text-center py-12 text-gray-500">Checklist not found.</div>;

  const completedCount = completion.items_completed.filter((i) => i.completed).length;
  const totalCount = completion.items_completed.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <button onClick={() => router.push("/dashboard/checklists")} className="text-gray-400 hover:text-white text-sm mb-2">← Back to Checklists</button>
        <h1 className="text-3xl font-bold">{completion.checklist_templates?.type === "opening" ? "🌅" : "🌙"} {completion.checklist_templates?.name || "Checklist"}</h1>
        <p className="text-gray-400">{completion.completed_by} · {completion.shift_date} · {completion.shift_type}</p>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{completedCount}/{totalCount} items completed</span>
          <span className="text-sm text-gray-400">{completion.completion_pct}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${allDone ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${completion.completion_pct}%` }} />
        </div>
        {completion.status === "completed" && (
          <div className="mt-2 text-green-400 text-sm font-medium">✅ Completed at {new Date(completion.completed_at!).toLocaleString()}</div>
        )}
      </div>

      {/* Checklist items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {completion.items_completed.map((item, idx) => (
            <div key={idx} className={`px-4 py-3 flex items-start gap-3 ${completion.status === "completed" ? "" : "cursor-pointer hover:bg-gray-800/30"}`} onClick={() => toggleItem(idx)}>
              <div className={`w-5 h-5 rounded border shrink-0 mt-0.5 flex items-center justify-center transition ${
                item.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-600"
              }`}>
                {item.completed && <span className="text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${item.completed ? "line-through text-gray-500" : ""}`}>
                  {item.task}
                </div>
                {item.notes && <div className="text-xs text-yellow-400 mt-1">📝 {item.notes}</div>}
                {item.completed_at && <div className="text-xs text-gray-600 mt-0.5">{new Date(item.completed_at).toLocaleTimeString()}</div>}
              </div>
              {completion.status !== "completed" && (
                <button onClick={(e) => { e.stopPropagation(); addNoteToItem(idx); }} className="text-gray-500 hover:text-yellow-400 text-xs shrink-0">
                  📝
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Handoff notes + Complete */}
      {completion.status !== "completed" && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Handoff Notes</h2>
          <textarea value={handoffNotes} onChange={(e) => setHandoffNotes(e.target.value)} placeholder="Notes for the next shift..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" rows={3} />
          <button
            onClick={completeChecklist}
            disabled={!allDone || saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition"
          >
            {saving ? "Completing..." : allDone ? "✅ Complete Checklist" : `Complete all items first (${totalCount - completedCount} remaining)`}
          </button>
        </div>
      )}

      {/* Show handoff notes if completed */}
      {completion.status === "completed" && completion.handoff_notes && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-2">Handoff Notes</h2>
          <p className="text-sm text-gray-300">{completion.handoff_notes}</p>
        </div>
      )}
    </div>
  );
}
