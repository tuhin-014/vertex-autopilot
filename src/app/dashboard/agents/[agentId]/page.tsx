"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { agents } from "@/lib/mock-data";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-2">Agent Not Found</h1>
        <p className="text-gray-400 mb-4">The agent &quot;{agentId}&quot; does not exist.</p>
        <Link href="/dashboard/agents" className="text-blue-400 hover:underline">
          Back to Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/agents" className="hover:text-white transition">
          AI Agents
        </Link>
        <span>/</span>
        <span className="text-gray-300">{agent.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{agent.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-gray-400">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              agent.status === "active"
                ? "bg-green-600/20 text-green-400 border border-green-600/30"
                : agent.status === "alert"
                ? "bg-red-600/20 text-red-400 border border-red-600/30 animate-pulse"
                : "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30"
            }`}
          >
            {agent.status === "active" ? "Active" : agent.status === "alert" ? "Alert" : "Paused"}
          </span>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition">
            Configure
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">
            Run Now
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{agent.actionsToday}</div>
          <div className="text-xs text-gray-400 mt-1">Actions Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${agent.alertsOpen > 0 ? "text-red-400" : "text-green-400"}`}>
            {agent.alertsOpen}
          </div>
          <div className="text-xs text-gray-400 mt-1">Open Alerts</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{agent.uptime}%</div>
          <div className="text-xs text-gray-400 mt-1">Uptime (30d)</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{agent.lastRun}</div>
          <div className="text-xs text-gray-400 mt-1">Last Run</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{agent.category}</div>
          <div className="text-xs text-gray-400 mt-1">Category</div>
        </div>
      </div>

      {/* Metrics + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            {agent.metrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-300">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{metric.value}</span>
                  {metric.trend === "up" && <span className="text-green-400 text-sm">↑</span>}
                  {metric.trend === "down" && <span className="text-red-400 text-sm">↓</span>}
                  {metric.trend === "flat" && <span className="text-gray-500 text-sm">→</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {agent.recentActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <span className="mt-0.5">
                  {action.severity === "critical" ? "🔴" : action.severity === "warning" ? "🟡" : "🟢"}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{action.description}</p>
                  <span className="text-xs text-gray-500 mt-1">{action.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Auto-execute actions</span>
              <span className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Require approval for critical actions</span>
              <span className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">SMS notifications</span>
              <span className="px-2 py-0.5 bg-green-600/20 text-green-400 rounded text-xs font-medium">Enabled</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Run frequency</span>
              <span className="text-sm text-gray-300 font-medium">Every 5 minutes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Coverage</span>
              <span className="text-sm text-gray-300 font-medium">All 73 locations</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Escalation contacts</span>
              <span className="text-sm text-gray-300 font-medium">Area Manager, VP Ops</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
