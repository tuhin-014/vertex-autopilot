"use client";

import { useEffect, useState } from "react";

export default function ForecastPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/financials/forecast").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="p-8 text-gray-400">Generating 30-day forecast...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🔮 Cash Flow Forecast</h1>
        <p className="text-gray-400">Based on {data.basedOn} · Simple moving average model</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">${data.avgDailyRevenue?.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Avg Daily Revenue</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">${data.avgDailyProfit?.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Avg Daily Profit</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">${data.projected30DayCash?.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">30-Day Projected Cash</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{data.forecast?.length}</div>
          <div className="text-sm text-gray-400 mt-1">Forecast Days</div>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800 bg-gray-900/50">
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Day</th>
              <th className="text-right p-3">Projected Revenue</th>
              <th className="text-right p-3">Projected Profit</th>
              <th className="text-right p-3">Running Cash</th>
            </tr>
          </thead>
          <tbody>
            {(data.forecast || []).map((day: any, i: number) => {
              const d = new Date(day.date);
              const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
              return (
                <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${isWeekend ? "bg-yellow-900/10" : ""}`}>
                  <td className="p-3">{day.date}</td>
                  <td className="p-3">
                    <span className={isWeekend ? "text-yellow-400" : "text-gray-400"}>
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    {isWeekend && <span className="ml-2 text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded">🔥</span>}
                  </td>
                  <td className="text-right p-3 text-green-400">${day.projected_revenue?.toLocaleString()}</td>
                  <td className={`text-right p-3 font-medium ${day.projected_profit >= 0 ? "text-blue-400" : "text-red-400"}`}>
                    ${day.projected_profit?.toLocaleString()}
                  </td>
                  <td className={`text-right p-3 font-semibold ${day.cumulative_cash >= 0 ? "text-purple-400" : "text-red-400"}`}>
                    ${day.cumulative_cash?.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.message && <p className="text-center text-gray-500 text-sm">{data.message}</p>}
    </div>
  );
}
