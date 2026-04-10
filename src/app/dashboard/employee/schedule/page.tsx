"use client";

import { employeeSchedule } from "@/lib/mock-data";

export default function EmployeeSchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Schedule</h1>
        <p className="text-gray-400">IHOP #1247 - Midtown Atlanta</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">This Week</h2>
        <div className="space-y-2">
          {employeeSchedule.map((shift) => (
            <div
              key={shift.day}
              className={`flex items-center justify-between p-4 rounded-lg ${
                shift.date === "Apr 9"
                  ? "bg-blue-600/10 border border-blue-600/30"
                  : "bg-gray-800/50"
              }`}
            >
              <div>
                <div className="font-medium text-gray-300">{shift.day}</div>
                <div className="text-sm text-gray-500">{shift.date}</div>
              </div>
              {shift.startTime === "Off" ? (
                <span className="text-gray-500 font-medium">Day Off</span>
              ) : (
                <div className="text-right">
                  <div className="font-medium text-gray-300">
                    {shift.startTime} - {shift.endTime}
                  </div>
                  <div className="text-sm text-gray-500">{shift.role}</div>
                  <div className="text-xs text-gray-600">{shift.location}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-3">Weekly Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {employeeSchedule.filter((s) => s.startTime !== "Off").length}
            </div>
            <div className="text-xs text-gray-400">Shifts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">40</div>
            <div className="text-xs text-gray-400">Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {employeeSchedule.filter((s) => s.startTime === "Off").length}
            </div>
            <div className="text-xs text-gray-400">Days Off</div>
          </div>
        </div>
      </div>
    </div>
  );
}
