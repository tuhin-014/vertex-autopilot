"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { locations, agents } from "@/lib/mock-data";

export default function LocationDetailPage() {
  const params = useParams();
  const locationId = params.locationId as string;
  const location = locations.find((l) => l.id === locationId);

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-2">Location Not Found</h1>
        <p className="text-gray-400 mb-4">The location &quot;{locationId}&quot; does not exist.</p>
        <Link href="/dashboard/locations" className="text-blue-400 hover:underline">
          Back to Locations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/locations" className="hover:text-white transition">Locations</Link>
        <span>/</span>
        <span className="text-gray-300">{location.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{location.name}</h1>
          <p className="text-gray-400">
            {location.address}, {location.city}, {location.state} | Manager: {location.manager}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
          location.status === "healthy" ? "bg-green-600/20 text-green-400 border border-green-600/30" :
          location.status === "warning" ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30" :
          "bg-red-600/20 text-red-400 border border-red-600/30"
        }`}>
          Health Score: {location.healthScore}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">${(location.revenue.today / 1000).toFixed(1)}K</div>
          <div className="text-xs text-gray-400 mt-1">Revenue Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${location.metrics.foodSafetyScore >= 90 ? "text-green-400" : "text-yellow-400"}`}>
            {location.metrics.foodSafetyScore}
          </div>
          <div className="text-xs text-gray-400 mt-1">Food Safety</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{location.metrics.customerRating}</div>
          <div className="text-xs text-gray-400 mt-1">Customer Rating</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${location.staffCount >= location.staffTarget ? "text-green-400" : "text-yellow-400"}`}>
            {location.staffCount}/{location.staffTarget}
          </div>
          <div className="text-xs text-gray-400 mt-1">Staff</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{location.metrics.laborCostPct}%</div>
          <div className="text-xs text-gray-400 mt-1">Labor Cost</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{location.metrics.wasteRate}%</div>
          <div className="text-xs text-gray-400 mt-1">Waste Rate</div>
        </div>
      </div>

      {/* Revenue MTD */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-3">Revenue MTD</h2>
        <div className="flex items-center gap-4 mb-2 text-sm">
          <span className="text-gray-400">MTD: ${(location.revenue.mtd / 1000).toFixed(1)}K</span>
          <span className="text-gray-400">Target: ${(location.revenue.target / 1000).toFixed(1)}K</span>
          <span className={`font-bold ${location.revenue.mtd >= location.revenue.target ? "text-green-400" : "text-yellow-400"}`}>
            {((location.revenue.mtd / location.revenue.target) * 100).toFixed(1)}% of target
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              location.revenue.mtd >= location.revenue.target ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(100, (location.revenue.mtd / location.revenue.target) * 100)}%` }}
          />
        </div>
      </div>

      {/* Alerts */}
      {(location.alerts.critical > 0 || location.alerts.warning > 0) && (
        <div className={`border rounded-xl p-5 ${
          location.alerts.critical > 0 ? "bg-red-600/5 border-red-600/20" : "bg-yellow-600/5 border-yellow-600/20"
        }`}>
          <h2 className="font-bold text-lg mb-3">Active Alerts</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-red-400">{location.alerts.critical}</div>
              <div className="text-xs text-gray-400">Critical</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">{location.alerts.warning}</div>
              <div className="text-xs text-gray-400">Warning</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{location.alerts.info}</div>
              <div className="text-xs text-gray-400">Info</div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Statuses */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">Agent Status at This Location</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {agents.map((agent) => {
            const status = location.agentStatuses[agent.id] || "active";
            return (
              <Link
                key={agent.id}
                href={`/dashboard/agents/${agent.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg border transition hover:bg-gray-800/50 ${
                  status === "alert"
                    ? "border-red-600/30 bg-red-600/5"
                    : status === "paused"
                    ? "border-yellow-600/30 bg-yellow-600/5"
                    : "border-gray-800 bg-gray-800/30"
                }`}
              >
                <span className="text-lg">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{agent.shortName}</div>
                  <div className={`text-xs ${
                    status === "active" ? "text-green-400" :
                    status === "alert" ? "text-red-400" :
                    "text-yellow-400"
                  }`}>
                    {status}
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${
                  status === "active" ? "bg-green-400" :
                  status === "alert" ? "bg-red-400 animate-pulse" :
                  "bg-yellow-400"
                }`} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">Performance Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Food Safety Score</span>
              <span className={`text-lg font-bold ${location.metrics.foodSafetyScore >= 90 ? "text-green-400" : "text-yellow-400"}`}>
                {location.metrics.foodSafetyScore}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Customer Rating</span>
              <span className="text-lg font-bold text-yellow-400">{location.metrics.customerRating} / 5.0</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Average Ticket</span>
              <span className="text-lg font-bold text-green-400">${location.metrics.avgTicket}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Labor Cost %</span>
              <span className={`text-lg font-bold ${location.metrics.laborCostPct <= 30 ? "text-green-400" : "text-yellow-400"}`}>
                {location.metrics.laborCostPct}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Waste Rate</span>
              <span className={`text-lg font-bold ${location.metrics.wasteRate <= 2 ? "text-green-400" : "text-yellow-400"}`}>
                {location.metrics.wasteRate}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-300">Staffing Level</span>
              <span className={`text-lg font-bold ${location.staffCount >= location.staffTarget ? "text-green-400" : "text-yellow-400"}`}>
                {Math.round((location.staffCount / location.staffTarget) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
