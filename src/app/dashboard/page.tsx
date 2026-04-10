"use client";

import Link from "next/link";
import { agents, locations, recentActivity, getAgentSummary, getLocationSummary } from "@/lib/mock-data";

export default function AreaManagerDashboard() {
  const agentSummary = getAgentSummary();
  const locationSummary = getLocationSummary();

  // Top critical/warning locations
  const alertLocations = locations.filter((l) => l.status !== "healthy").sort((a, b) => a.healthScore - b.healthScore);

  // Performance rankings
  const rankedLocations = [...locations].sort((a, b) => b.healthScore - a.healthScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Regional Command Center</h1>
          <p className="text-gray-400">IHOP Southeast Region - 73 Locations - Area Manager View</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-600/10 border border-green-600/30 rounded-full px-4 py-1.5 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">73</div>
          <div className="text-xs text-gray-400 mt-1">Total Locations</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{locationSummary.healthy}</div>
          <div className="text-xs text-gray-400 mt-1">Healthy</div>
        </div>
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{locationSummary.warning}</div>
          <div className="text-xs text-gray-400 mt-1">Warning</div>
        </div>
        <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{locationSummary.critical}</div>
          <div className="text-xs text-gray-400 mt-1">Critical</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{agentSummary.totalActions}</div>
          <div className="text-xs text-gray-400 mt-1">Agent Actions Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">${(locationSummary.totalRevenue / 1000).toFixed(0)}K</div>
          <div className="text-xs text-gray-400 mt-1">Revenue Today</div>
        </div>
      </div>

      {/* Critical Alerts */}
      {alertLocations.length > 0 && (
        <div className="bg-red-600/5 border border-red-600/20 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-3 text-red-400">Critical & Warning Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alertLocations.map((loc) => (
              <Link
                key={loc.id}
                href={`/dashboard/locations/${loc.id}`}
                className={`flex items-center justify-between p-3 rounded-lg border transition hover:bg-gray-800/50 ${
                  loc.status === "critical"
                    ? "bg-red-600/5 border-red-600/30"
                    : "bg-yellow-600/5 border-yellow-600/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg ${loc.status === "critical" ? "text-red-400" : "text-yellow-400"}`}>
                    {loc.status === "critical" ? "🔴" : "🟡"}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{loc.name}</div>
                    <div className="text-xs text-gray-500">{loc.city}, {loc.state} - {loc.manager}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${loc.healthScore < 85 ? "text-red-400" : "text-yellow-400"}`}>
                    {loc.healthScore}
                  </div>
                  <div className="text-xs text-gray-500">Health Score</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 14 AI Agents Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">14 AI Agents</h2>
          <Link href="/dashboard/agents" className="text-blue-400 text-sm hover:underline">
            View All Details →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/dashboard/agents/${agent.id}`}
              className={`bg-gray-900 border rounded-xl p-4 hover:bg-gray-800/50 transition ${
                agent.status === "alert"
                  ? "border-red-600/40"
                  : agent.status === "paused"
                  ? "border-yellow-600/40"
                  : "border-gray-800 hover:border-blue-600/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{agent.icon}</span>
                  <span className="font-medium text-sm">{agent.shortName}</span>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    agent.status === "active"
                      ? "bg-green-400"
                      : agent.status === "alert"
                      ? "bg-red-400 animate-pulse"
                      : "bg-yellow-400"
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Actions</span>
                  <div className="font-bold text-gray-300">{agent.actionsToday}</div>
                </div>
                <div>
                  <span className="text-gray-500">Alerts</span>
                  <div className={`font-bold ${agent.alertsOpen > 0 ? "text-red-400" : "text-gray-400"}`}>
                    {agent.alertsOpen}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Uptime</span>
                  <div className="font-bold text-green-400">{agent.uptime}%</div>
                </div>
                <div>
                  <span className="text-gray-500">Last Run</span>
                  <div className="font-bold text-gray-300">{agent.lastRun}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column: Performance Rankings + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Rankings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Location Rankings</h2>
            <Link href="/dashboard/locations" className="text-blue-400 text-sm hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {rankedLocations.map((loc, i) => (
              <Link
                key={loc.id}
                href={`/dashboard/locations/${loc.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0
                      ? "bg-yellow-500/20 text-yellow-400"
                      : i === 1
                      ? "bg-gray-400/20 text-gray-300"
                      : i === 2
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{loc.name}</div>
                  <div className="text-xs text-gray-500">
                    {loc.city}, {loc.state}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-bold ${loc.healthScore >= 90 ? "text-green-400" : loc.healthScore >= 80 ? "text-yellow-400" : "text-red-400"}`}>
                    {loc.healthScore}
                  </span>
                  <span className="text-gray-500">${(loc.revenue.today / 1000).toFixed(1)}K</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Live Agent Activity</h2>
            <Link href="/dashboard/events" className="text-blue-400 text-sm hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
                <span className="mt-0.5">
                  {item.severity === "critical" ? "🔴" : item.severity === "warning" ? "🟡" : "🟢"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-300">{item.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{item.agentIcon} {item.agentName}</span>
                    {item.locationName && (
                      <span className="text-xs text-gray-600">| {item.locationName}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-600 whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Compliance + Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold mb-3">Regional Compliance</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Health Score</span>
              <span className="font-bold text-green-400">{locationSummary.avgHealthScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Compliance Rate</span>
              <span className="font-bold text-green-400">96%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Licenses</span>
              <span className="font-bold text-blue-400">219</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending Audits</span>
              <span className="font-bold text-yellow-400">3</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold mb-3">Workforce</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Staff</span>
              <span className="font-bold text-blue-400">{locationSummary.totalStaff}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Open Positions</span>
              <span className="font-bold text-purple-400">34</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Time-to-Hire</span>
              <span className="font-bold text-cyan-400">8.2 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Training Completion</span>
              <span className="font-bold text-green-400">87%</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-bold mb-3">Revenue Overview</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Today (all stores)</span>
              <span className="font-bold text-green-400">${(locationSummary.totalRevenue / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">vs Forecast</span>
              <span className="font-bold text-green-400">+3.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Ticket</span>
              <span className="font-bold text-blue-400">$14.82</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Promos</span>
              <span className="font-bold text-purple-400">6</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
