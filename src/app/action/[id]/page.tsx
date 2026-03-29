"use client";

import { useEffect, useState } from "react";

interface ActionStep {
  step: number;
  action: string;
  done: boolean;
}

interface CorrectiveAction {
  id: string;
  trigger_description: string;
  equipment: string;
  temperature: number;
  action_steps: ActionStep[];
  status: string;
  assigned_to: string;
  created_at: string;
  locations?: { name: string };
}

export default function CorrectiveActionPage({ params }: { params: Promise<{ id: string }> }) {
  const [action, setAction] = useState<CorrectiveAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    params.then(async (p) => {
      const res = await fetch(`/api/corrective-actions/${p.id}`);
      if (res.ok) { const data = await res.json(); setAction(data); }
      setLoading(false);
    });
  }, [params]);

  async function toggleStep(stepIdx: number) {
    if (!action) return;
    const newSteps = [...action.action_steps];
    newSteps[stepIdx] = { ...newSteps[stepIdx], done: !newSteps[stepIdx].done };
    setAction({ ...action, action_steps: newSteps });

    // Save to DB
    const { id } = await params;
    await fetch(`/api/corrective-actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_steps: newSteps }),
    });
  }

  async function handleResolve() {
    setSaving(true);
    const { id } = await params;
    await fetch(`/api/corrective-actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved", resolution_notes: notes, resolved_by: action?.assigned_to || "Staff" }),
    });
    setResolved(true);
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;
  if (!action) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Action not found</div>;

  if (resolved || action.status === "resolved") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl">✅</span>
          <h1 className="text-2xl font-bold mt-4">Corrective Action Resolved</h1>
          <p className="text-gray-400 mt-2">Great job! This has been logged and closed.</p>
        </div>
      </div>
    );
  }

  const allDone = action.action_steps.every(s => s.done);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-red-600/10 border-b border-red-600/30 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold">Corrective Action Required</div>
            <div className="text-xs text-red-300">{(action.locations as Record<string, string>)?.name || "Store"}</div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Issue */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Issue</div>
          <div className="font-bold">{action.trigger_description}</div>
          {action.equipment && <div className="text-sm text-gray-500 mt-1">Equipment: {action.equipment}</div>}
          {action.temperature && <div className="text-sm text-red-400 mt-1">Temperature: {action.temperature}°F</div>}
          <div className="text-xs text-gray-600 mt-2">Assigned to: {action.assigned_to} • {new Date(action.created_at).toLocaleString()}</div>
        </div>

        {/* Steps Checklist */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-3">Action Steps</div>
          <div className="space-y-3">
            {action.action_steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition ${
                  step.done ? "bg-green-600/10 border border-green-600/30" : "bg-gray-800 border border-gray-700"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  step.done ? "bg-green-600 text-white" : "bg-gray-700 text-gray-400"
                }`}>
                  {step.done ? "✓" : step.step}
                </div>
                <span className={`text-sm ${step.done ? "text-green-300 line-through" : "text-gray-200"}`}>
                  {step.action}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resolve */}
        {allDone && (
          <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 space-y-3">
            <div className="text-green-400 font-bold text-center">All steps completed! ✅</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resolution notes (optional)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm h-20"
            />
            <button
              onClick={handleResolve}
              disabled={saving}
              className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition disabled:opacity-50"
            >
              {saving ? "Resolving..." : "✅ Mark as Resolved"}
            </button>
          </div>
        )}

        {!allDone && (
          <p className="text-center text-sm text-gray-500">
            Complete all steps above, then resolve this action.
          </p>
        )}
      </div>
    </div>
  );
}
