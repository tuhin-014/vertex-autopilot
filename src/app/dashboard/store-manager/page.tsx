"use client";

import Link from "next/link";
import { storeManagerData, agents } from "@/lib/mock-data";

export default function StoreManagerDashboard() {
  const { location, todayTasks, staffOnDuty, staffScheduled, recentReviews, inventoryAlerts } = storeManagerData;
  const completedTasks = todayTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Store Dashboard</h1>
          <p className="text-gray-400">
            {location.name} - {location.city}, {location.state}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            location.status === "healthy" ? "bg-green-600/20 text-green-400 border border-green-600/30" :
            location.status === "warning" ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30" :
            "bg-red-600/20 text-red-400 border border-red-600/30"
          }`}>
            Health Score: {location.healthScore}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">${(location.revenue.today / 1000).toFixed(1)}K</div>
          <div className="text-xs text-gray-400 mt-1">Revenue Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{staffOnDuty}/{staffScheduled}</div>
          <div className="text-xs text-gray-400 mt-1">Staff On Duty</div>
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
          <div className="text-2xl font-bold text-purple-400">{completedTasks}/{todayTasks.length}</div>
          <div className="text-xs text-gray-400 mt-1">Tasks Done</div>
        </div>
      </div>

      {/* Revenue vs Target */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-3">Revenue vs Target</h2>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-gray-400">MTD: ${(location.revenue.mtd / 1000).toFixed(1)}K</span>
          <span className="text-sm text-gray-400">Target: ${(location.revenue.target / 1000).toFixed(1)}K</span>
          <span className={`text-sm font-bold ${location.revenue.mtd >= location.revenue.target ? "text-green-400" : "text-yellow-400"}`}>
            {((location.revenue.mtd / location.revenue.target) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${location.revenue.mtd >= location.revenue.target ? "bg-green-500" : "bg-blue-500"}`}
            style={{ width: `${Math.min(100, (location.revenue.mtd / location.revenue.target) * 100)}%` }}
          />
        </div>
      </div>

      {/* Two Column: Tasks + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Today&apos;s Priorities</h2>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                  task.completed ? "bg-green-600 border-green-600 text-white" : "border-gray-600"
                }`}>
                  {task.completed && "✓"}
                </span>
                <span className={`flex-1 text-sm ${task.completed ? "text-gray-500 line-through" : "text-gray-300"}`}>
                  {task.title}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  task.priority === "high" ? "bg-red-600/20 text-red-400" :
                  task.priority === "medium" ? "bg-yellow-600/20 text-yellow-400" :
                  "bg-gray-700 text-gray-400"
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Recent Reviews</h2>
          <div className="space-y-3">
            {recentReviews.map((review, i) => (
              <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} className={j < review.rating ? "text-yellow-400" : "text-gray-600"}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{review.platform}</span>
                    <span>{review.date}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory + Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Inventory Alerts</h2>
            <Link href="/dashboard/inventory" className="text-blue-400 text-sm hover:underline">View All →</Link>
          </div>
          <div className="space-y-2">
            {inventoryAlerts.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-300">{item.item}</div>
                  <div className="text-xs text-gray-500">Reorder at: {item.reorderPoint}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.level === "Critical" ? "bg-red-600/20 text-red-400" :
                    item.level === "Low" ? "bg-yellow-600/20 text-yellow-400" :
                    "bg-green-600/20 text-green-400"
                  }`}>
                    {item.level}
                  </span>
                  <div className="text-xs text-gray-400 mt-1">{item.qty}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Activity for This Store */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Agent Status (This Store)</h2>
          <div className="grid grid-cols-2 gap-2">
            {agents.slice(0, 8).map((agent) => (
              <Link
                key={agent.id}
                href={`/dashboard/agents/${agent.id}`}
                className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition"
              >
                <span>{agent.icon}</span>
                <span className="text-xs text-gray-300 flex-1 truncate">{agent.shortName}</span>
                <span className={`w-2 h-2 rounded-full ${
                  agent.status === "active" ? "bg-green-400" : agent.status === "alert" ? "bg-red-400" : "bg-yellow-400"
                }`} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
