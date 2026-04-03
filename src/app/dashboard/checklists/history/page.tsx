"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Completion {
  id: string;
  completed_by: string;
  shift_date: string;
  shift_type: string;
  status: string;
  completion_pct: number;
  started_at: string;
  completed_at: string | null;
  handoff_notes: string | null;
  checklist_templates: { name: string; type: string } | null;
}

interface ComplianceData {
  total: number;
  completed: number;
  rate: number;
}

interface EmployeeData {
  completed: number;
  incomplete: number;
  avgPct: number;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  incomplete: "bg-red-500/20 text-red-400",
};

export default function ChecklistHistoryPage() {
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [compliance, setCompliance] = useState<Record<string, ComplianceData>>({});
  const [byEmployee, setByEmployee] = useState<Record<string, EmployeeData>>({});
  const [summary, setSummary] = useState({ total: 0, completed: 0, in_progress: 0, incomplete: 0 });
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/checklists/history?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        setCompletions(d.completions || []);
        setCompliance(d.compliance || {});
        setByEmployee(d.by_employee || {});
        setSummary(d.summary || { total: 0, completed: 0, in_progress: 0, incomplete: 0 });
        setLoading(false);
      });
  }, [days]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading history...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Compliance History</h1>
          <p className="text-gray-400">Checklist completion by shift and employee</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm">
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{summary.total}</div>
          <div className="text-sm text-gray-400 mt-1">Total Checklists</div>
        </div>
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{summary.completed}</div>
          <div className="text-sm text-gray-400 mt-1">Completed</div>
        </div>
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{summary.in_progress}</div>
          <div className="text-sm text-gray-400 mt-1">In Progress</div>
        </div>
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{summary.incomplete}</div>
          <div className="text-sm text-gray-400 mt-1">Incomplete</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by shift */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-4">Compliance by Shift Type</h2>
          <div className="space-y-4">
            {Object.entries(compliance).map(([type, data]) => (
              <div key={type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="capitalize">{type === "opening" ? "🌅" : "🌙"} {type}</span>
                  <span className={data.rate >= 80 ? "text-green-400" : data.rate >= 50 ? "text-yellow-400" : "text-red-400"}>
                    {data.rate}% ({data.completed}/{data.total})
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${data.rate >= 80 ? "bg-green-500" : data.rate >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${data.rate}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(compliance).length === 0 && <p className="text-gray-500 text-sm">No data yet</p>}
          </div>
        </div>

        {/* By employee */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="font-semibold mb-4">By Employee</h2>
          <div className="space-y-3">
            {Object.entries(byEmployee).sort((a, b) => b[1].avgPct - a[1].avgPct).map(([emp, data]) => (
              <div key={emp} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{emp}</div>
                  <div className="text-xs text-gray-500">{data.completed} completed, {data.incomplete} incomplete</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${data.avgPct >= 80 ? "bg-green-500/20 text-green-400" : data.avgPct >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                  {data.avgPct}%
                </span>
              </div>
            ))}
            {Object.keys(byEmployee).length === 0 && <p className="text-gray-500 text-sm">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent completions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-semibold">Recent Completions</h2>
        </div>
        {completions.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No checklists completed yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3">Checklist</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3 text-right">Progress</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {completions.slice(0, 50).map((c) => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/checklists/${c.id}`} className="text-blue-400 hover:underline">
                      {c.checklist_templates?.name || "Checklist"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.completed_by}</td>
                  <td className="px-4 py-3 text-gray-400">{c.shift_date}</td>
                  <td className="px-4 py-3 capitalize">{c.shift_type === "opening" ? "🌅" : "🌙"} {c.shift_type}</td>
                  <td className="px-4 py-3 text-right">{c.completion_pct}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[c.status] || "bg-gray-500/20 text-gray-400"}`}>
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
