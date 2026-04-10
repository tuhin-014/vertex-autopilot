"use client";

import Link from "next/link";
import { agents, getAgentSummary } from "@/lib/mock-data";

export default function AgentsPage() {
  const summary = getAgentSummary();

  const categories = [...new Set(agents.map((a) => a.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-gray-400">14 autonomous agents managing your operations 24/7</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1 bg-green-600/10 border border-green-600/30 rounded-full text-green-400">
            {summary.active} Active
          </span>
          <span className="px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full text-red-400">
            {summary.alerting} Alert
          </span>
          <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-gray-400">
            {summary.totalActions} actions today
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{summary.total}</div>
          <div className="text-xs text-gray-400 mt-1">Total Agents</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{summary.totalActions}</div>
          <div className="text-xs text-gray-400 mt-1">Actions Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{summary.totalAlerts}</div>
          <div className="text-xs text-gray-400 mt-1">Open Alerts</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">99.7%</div>
          <div className="text-xs text-gray-400 mt-1">Avg Uptime</div>
        </div>
      </div>

      {/* Agents by Category */}
      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">{cat}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents
              .filter((a) => a.category === cat)
              .map((agent) => (
                <Link
                  key={agent.id}
                  href={`/dashboard/agents/${agent.id}`}
                  className={`bg-gray-900 border rounded-xl p-5 hover:bg-gray-800/50 transition ${
                    agent.status === "alert"
                      ? "border-red-600/40"
                      : "border-gray-800 hover:border-blue-600/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{agent.icon}</span>
                      <div>
                        <div className="font-bold">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.category}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        agent.status === "active"
                          ? "bg-green-600/20 text-green-400"
                          : agent.status === "alert"
                          ? "bg-red-600/20 text-red-400"
                          : "bg-yellow-600/20 text-yellow-400"
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{agent.description}</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {agent.metrics.map((m) => (
                      <div key={m.label}>
                        <div className="text-gray-500">{m.label}</div>
                        <div className="font-bold text-gray-300 flex items-center gap-1">
                          {m.value}
                          {m.trend === "up" && <span className="text-green-400">↑</span>}
                          {m.trend === "down" && <span className="text-red-400">↓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Recent action preview */}
                  {agent.recentActions[0] && (
                    <div className="mt-3 pt-3 border-t border-gray-800 flex items-start gap-2">
                      <span className="mt-0.5">
                        {agent.recentActions[0].severity === "critical" ? "🔴" : agent.recentActions[0].severity === "warning" ? "🟡" : "🟢"}
                      </span>
                      <div className="text-xs text-gray-400 flex-1 line-clamp-2">{agent.recentActions[0].description}</div>
                      <span className="text-xs text-gray-600 whitespace-nowrap">{agent.recentActions[0].time}</span>
                    </div>
                  )}
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
