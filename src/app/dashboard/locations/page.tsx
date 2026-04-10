"use client";

import Link from "next/link";
import { locations, getLocationSummary } from "@/lib/mock-data";
import { useState } from "react";

type SortKey = "name" | "healthScore" | "revenue" | "alerts";

export default function LocationsPage() {
  const summary = getLocationSummary();
  const [sortBy, setSortBy] = useState<SortKey>("healthScore");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = locations.filter((l) => filterStatus === "all" || l.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "healthScore":
        return b.healthScore - a.healthScore;
      case "revenue":
        return b.revenue.today - a.revenue.today;
      case "alerts":
        return (b.alerts.critical + b.alerts.warning) - (a.alerts.critical + a.alerts.warning);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Locations</h1>
          <p className="text-gray-400">73 IHOP locations across the Southeast</p>
        </div>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="px-3 py-1 bg-green-600/10 border border-green-600/30 rounded-full text-green-400">
            {summary.healthy} Healthy
          </span>
          <span className="px-3 py-1 bg-yellow-600/10 border border-yellow-600/30 rounded-full text-yellow-400">
            {summary.warning} Warning
          </span>
          <span className="px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full text-red-400">
            {summary.critical} Critical
          </span>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
          {["all", "healthy", "warning", "critical"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${
                filterStatus === status ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300"
        >
          <option value="healthScore">Sort by Health Score</option>
          <option value="name">Sort by Name</option>
          <option value="revenue">Sort by Revenue</option>
          <option value="alerts">Sort by Alerts</option>
        </select>
      </div>

      {/* Location Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((loc) => (
          <Link
            key={loc.id}
            href={`/dashboard/locations/${loc.id}`}
            className={`bg-gray-900 border rounded-xl p-5 hover:bg-gray-800/50 transition ${
              loc.status === "critical"
                ? "border-red-600/50"
                : loc.status === "warning"
                ? "border-yellow-600/50"
                : "border-gray-800 hover:border-blue-600/40"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    loc.status === "healthy" ? "bg-green-400" :
                    loc.status === "warning" ? "bg-yellow-400" :
                    "bg-red-400 animate-pulse"
                  }`} />
                  <h3 className="font-bold text-sm">{loc.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">{loc.address}, {loc.city}, {loc.state}</p>
                <p className="text-xs text-gray-500">Manager: {loc.manager}</p>
              </div>
              <div className={`text-2xl font-bold ${
                loc.healthScore >= 90 ? "text-green-400" :
                loc.healthScore >= 80 ? "text-yellow-400" :
                "text-red-400"
              }`}>
                {loc.healthScore}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
              <div>
                <div className="text-gray-500">Revenue</div>
                <div className="font-bold text-gray-300">${(loc.revenue.today / 1000).toFixed(1)}K</div>
              </div>
              <div>
                <div className="text-gray-500">Staff</div>
                <div className={`font-bold ${loc.staffCount < loc.staffTarget ? "text-yellow-400" : "text-green-400"}`}>
                  {loc.staffCount}/{loc.staffTarget}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Rating</div>
                <div className="font-bold text-yellow-400">{loc.metrics.customerRating}</div>
              </div>
              <div>
                <div className="text-gray-500">Alerts</div>
                <div className={`font-bold ${loc.alerts.critical > 0 ? "text-red-400" : loc.alerts.warning > 0 ? "text-yellow-400" : "text-gray-400"}`}>
                  {loc.alerts.critical + loc.alerts.warning}
                </div>
              </div>
            </div>

            {/* Health bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    loc.healthScore >= 90 ? "bg-green-500" :
                    loc.healthScore >= 80 ? "bg-yellow-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${loc.healthScore}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
