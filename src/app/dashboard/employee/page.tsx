"use client";

import Link from "next/link";
import {
  employeeSchedule,
  trainingAssignments,
  employeeTasks,
  announcements,
} from "@/lib/mock-data";

export default function EmployeeDashboard() {
  const todayShift = employeeSchedule.find((s) => s.date === "Apr 9");
  const completedTasks = employeeTasks.filter((t) => t.completed).length;
  const overdue = trainingAssignments.filter((t) => t.status === "overdue").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, James</h1>
        <p className="text-gray-400">IHOP #1247 - Midtown Atlanta | Line Cook</p>
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-blue-400">
            {todayShift?.startTime === "Off" ? "Off" : todayShift?.startTime || "--"}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {todayShift?.startTime === "Off" ? "Day Off" : "Shift Start"}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-purple-400">{completedTasks}/{employeeTasks.length}</div>
          <div className="text-xs text-gray-400 mt-1">Tasks Done</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className={`text-xl font-bold ${overdue > 0 ? "text-red-400" : "text-green-400"}`}>
            {overdue > 0 ? `${overdue} overdue` : "On track"}
          </div>
          <div className="text-xs text-gray-400 mt-1">Training</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-green-400">{announcements.length}</div>
          <div className="text-xs text-gray-400 mt-1">Announcements</div>
        </div>
      </div>

      {/* Clock In/Out */}
      {todayShift && todayShift.startTime !== "Off" && (
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">Today&apos;s Shift</div>
            <div className="text-gray-400 text-sm">
              {todayShift.startTime} - {todayShift.endTime} | {todayShift.role}
            </div>
          </div>
          <button className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg transition">
            Clock In
          </button>
        </div>
      )}

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Checklist */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Today&apos;s Tasks</h2>
            <Link href="/dashboard/employee/tasks" className="text-blue-400 text-sm hover:underline">View All →</Link>
          </div>
          <div className="space-y-2">
            {employeeTasks.map((task) => (
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

        {/* Schedule */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">This Week&apos;s Schedule</h2>
            <Link href="/dashboard/employee/schedule" className="text-blue-400 text-sm hover:underline">Full Schedule →</Link>
          </div>
          <div className="space-y-2">
            {employeeSchedule.map((shift) => (
              <div
                key={shift.day}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  shift.date === "Apr 9" ? "bg-blue-600/10 border border-blue-600/30" : "bg-gray-800/50"
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-gray-300">{shift.day}</div>
                  <div className="text-xs text-gray-500">{shift.date}</div>
                </div>
                {shift.startTime === "Off" ? (
                  <span className="text-sm text-gray-500">Day Off</span>
                ) : (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-300">{shift.startTime} - {shift.endTime}</div>
                    <div className="text-xs text-gray-500">{shift.role}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Training Progress</h2>
            <Link href="/dashboard/employee/training" className="text-blue-400 text-sm hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {trainingAssignments.map((training) => (
              <div key={training.id} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">{training.title}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    training.status === "completed" ? "bg-green-600/20 text-green-400" :
                    training.status === "overdue" ? "bg-red-600/20 text-red-400" :
                    training.status === "in_progress" ? "bg-blue-600/20 text-blue-400" :
                    "bg-gray-700 text-gray-400"
                  }`}>
                    {training.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        training.status === "completed" ? "bg-green-500" :
                        training.status === "overdue" ? "bg-red-500" :
                        "bg-blue-500"
                      }`}
                      style={{ width: `${training.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{training.progress}%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Due: {training.dueDate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">Announcements</h2>
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className={`p-4 rounded-lg border ${
                ann.priority === "high" ? "bg-red-600/5 border-red-600/20" :
                ann.priority === "medium" ? "bg-yellow-600/5 border-yellow-600/20" :
                "bg-gray-800/50 border-gray-700"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-300">{ann.title}</span>
                  <span className="text-xs text-gray-500">{ann.date}</span>
                </div>
                <p className="text-xs text-gray-400">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
