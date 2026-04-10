"use client";

import Link from "next/link";
import { locations, agents } from "@/lib/mock-data";

export default function SchedulingPage() {
  const schedulingAgent = agents.find((a) => a.id === "scheduling");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Scheduling</h1>
          <p className="text-gray-400">Shift management across 73 locations</p>
        </div>
        <Link
          href="/dashboard/agents/scheduling"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
        >
          View Scheduling Agent
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {schedulingAgent?.metrics.map((m) => (
          <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{m.value}</div>
            <div className="text-xs text-gray-400 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">Recent Scheduling Activity</h2>
        <div className="space-y-3">
          {schedulingAgent?.recentActions.map((action, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="mt-0.5">
                {action.severity === "critical" ? "🔴" : action.severity === "warning" ? "🟡" : "🟢"}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-300">{action.description}</p>
                <span className="text-xs text-gray-500">{action.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage by Location */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">Staffing Coverage by Location</h2>
        <div className="space-y-2">
          {locations.map((loc) => {
            const pct = Math.round((loc.staffCount / loc.staffTarget) * 100);
            return (
              <div key={loc.id} className="flex items-center gap-3 p-2">
                <span className="text-sm text-gray-300 w-48 truncate">{loc.name}</span>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      pct >= 100 ? "bg-green-500" : pct >= 80 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-12 text-right ${
                  pct >= 100 ? "text-green-400" : pct >= 80 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {pct}%
                </span>
                <span className="text-xs text-gray-500 w-16 text-right">
                  {loc.staffCount}/{loc.staffTarget}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
