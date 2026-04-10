"use client";

import { trainingAssignments } from "@/lib/mock-data";

export default function EmployeeTrainingPage() {
  const completed = trainingAssignments.filter((t) => t.status === "completed").length;
  const total = trainingAssignments.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Training</h1>
        <p className="text-gray-400">Track your certifications and training progress</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{total}</div>
          <div className="text-xs text-gray-400 mt-1">Total Assignments</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-gray-400 mt-1">Completed</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {trainingAssignments.filter((t) => t.status === "in_progress").length}
          </div>
          <div className="text-xs text-gray-400 mt-1">In Progress</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {trainingAssignments.filter((t) => t.status === "overdue").length}
          </div>
          <div className="text-xs text-gray-400 mt-1">Overdue</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">All Training Assignments</h2>
        <div className="space-y-4">
          {trainingAssignments.map((training) => (
            <div key={training.id} className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-300">{training.title}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  training.status === "completed" ? "bg-green-600/20 text-green-400" :
                  training.status === "overdue" ? "bg-red-600/20 text-red-400" :
                  training.status === "in_progress" ? "bg-blue-600/20 text-blue-400" :
                  "bg-gray-700 text-gray-400"
                }`}>
                  {training.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      training.status === "completed" ? "bg-green-500" :
                      training.status === "overdue" ? "bg-red-500" :
                      "bg-blue-500"
                    }`}
                    style={{ width: `${training.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-400">{training.progress}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">Due: {training.dueDate}</div>
              {training.status !== "completed" && (
                <button className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">
                  {training.status === "not_started" ? "Start Training" : "Continue"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
