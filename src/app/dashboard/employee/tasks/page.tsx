"use client";

import { employeeTasks } from "@/lib/mock-data";

export default function EmployeeTasksPage() {
  const completed = employeeTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-gray-400">
          {completed} of {employeeTasks.length} tasks completed today
        </p>
      </div>

      {/* Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Today&apos;s Progress</span>
          <span className="text-sm font-bold text-blue-400">{Math.round((completed / employeeTasks.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${(completed / employeeTasks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">Task Checklist</h2>
        <div className="space-y-2">
          {employeeTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
              <button className={`w-6 h-6 rounded border-2 flex items-center justify-center text-sm transition ${
                task.completed
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-gray-600 hover:border-blue-400"
              }`}>
                {task.completed && "✓"}
              </button>
              <span className={`flex-1 ${task.completed ? "text-gray-500 line-through" : "text-gray-300"}`}>
                {task.title}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
    </div>
  );
}
