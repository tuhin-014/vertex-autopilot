"use client";

import { useEffect, useState } from "react";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PrepTargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/waste/prep-targets").then(r => r.json()).then(d => { setTargets(d.targets || []); setLoading(false); });
  }, []);

  const grouped: Record<number, any[]> = {};
  for (const t of targets) {
    if (!grouped[t.day_of_week]) grouped[t.day_of_week] = [];
    grouped[t.day_of_week].push(t);
  }

  if (loading) return <div className="p-8 text-gray-400">Loading prep targets...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎯 Prep Targets</h1>
        <p className="text-gray-400">Suggested daily prep quantities based on sales and waste data</p>
      </div>

      {[0, 1, 2, 3, 4, 5, 6].filter(d => grouped[d]?.length).map(day => (
        <div key={day} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold mb-3">{dayNames[day]} {(day === 0 || day === 5 || day === 6) && <span className="text-yellow-400 text-xs ml-2">🔥 High Volume</span>}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {(grouped[day] || []).map((t: any) => (
              <div key={t.id} className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="font-medium text-sm">{t.inventory_items?.name || "Item"}</div>
                <div className="text-2xl font-bold mt-1">{Number(t.suggested_qty).toFixed(0)}</div>
                <div className="text-gray-500 text-xs">{t.unit}</div>
                <div className="text-gray-600 text-xs mt-1">Based on: {t.based_on}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {targets.length === 0 && (
        <div className="text-center py-12 text-gray-500">No prep targets set yet. The waste agent will generate these automatically based on sales data.</div>
      )}
    </div>
  );
}
