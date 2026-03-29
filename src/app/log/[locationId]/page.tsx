"use client";

import { useState, useEffect } from "react";

interface Equipment {
  equipment_name: string;
}

export default function MobileTempLog({ params }: { params: Promise<{ locationId: string }> }) {
  const [locationId, setLocationId] = useState("");
  const [locationName, setLocationName] = useState("Loading...");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [temperature, setTemperature] = useState("");
  const [recorderName, setRecorderName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; violation?: boolean; message: string } | null>(null);
  const [recentLogs, setRecentLogs] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    params.then(async (p) => {
      setLocationId(p.locationId);

      // Fetch location info
      const locRes = await fetch(`/api/locations/${p.locationId}`);
      if (locRes.ok) {
        const locData = await locRes.json();
        setLocationName(locData.name || "Unknown Store");
      }

      // Fetch equipment list
      const eqRes = await fetch(`/api/temp-log-schedules?location_id=${p.locationId}`);
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipment(eqData.data || []);
        if (eqData.data?.length > 0) setSelectedEquipment(eqData.data[0].equipment_name);
      }

      // Fetch recent logs
      const logsRes = await fetch(`/api/temp-logs?location_id=${p.locationId}&limit=10`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setRecentLogs(logsData.data || []);
      }
    });
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEquipment || !temperature) return;

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/temp-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: locationId,
          equipment: selectedEquipment,
          temperature: Number(temperature),
          recorder_name: recorderName || "Mobile User",
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({
          success: true,
          violation: data.violation,
          message: data.violation
            ? `⚠️ OUT OF RANGE! ${temperature}°F logged. Corrective action may be created.`
            : `✅ ${temperature}°F logged successfully for ${selectedEquipment}`,
        });
        setTemperature("");
        setNotes("");
        // Refresh recent logs
        const logsRes = await fetch(`/api/temp-logs?location_id=${locationId}&limit=10`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setRecentLogs(logsData.data || []);
        }
      } else {
        setResult({ success: false, message: data.error || "Failed to log temperature" });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌡️</span>
          <div>
            <div className="font-bold">Temp Log</div>
            <div className="text-xs text-gray-400">{locationName}</div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Result Banner */}
        {result && (
          <div className={`p-4 rounded-xl text-center font-medium ${
            result.violation ? "bg-red-600/20 border border-red-600/40 text-red-300" :
            result.success ? "bg-green-600/20 border border-green-600/40 text-green-300" :
            "bg-red-600/20 border border-red-600/40 text-red-300"
          }`}>
            {result.message}
          </div>
        )}

        {/* Log Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Equipment</label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg"
            >
              {equipment.map((eq) => (
                <option key={eq.equipment_name} value={eq.equipment_name}>{eq.equipment_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Temperature (°F)</label>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="e.g. 38"
              className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-3xl text-center font-bold"
              required
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Cold storage: ≤ 41°F</span>
              <span>Hot hold: ≥ 135°F</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Your Name</label>
            <input
              type="text"
              value={recorderName}
              onChange={(e) => setRecorderName(e.target.value)}
              placeholder="Who's logging this?"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything unusual?"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !temperature}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition disabled:opacity-50"
          >
            {submitting ? "Logging..." : "📝 Log Temperature"}
          </button>
        </form>

        {/* Recent Logs */}
        <div>
          <h3 className="font-bold text-sm text-gray-400 mb-2">Recent Logs</h3>
          <div className="space-y-2">
            {recentLogs.length > 0 ? recentLogs.map((log, i) => {
              const temp = Number((log as Record<string, unknown>).temperature);
              const equip = String((log as Record<string, unknown>).equipment || "");
              const isCold = equip.toLowerCase().includes("cooler") || equip.toLowerCase().includes("freezer");
              const violation = isCold ? temp > 41 : temp < 135;
              return (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${violation ? "bg-red-600/10 border border-red-600/30" : "bg-gray-800"}`}>
                  <div>
                    <div className="text-sm font-medium">{equip}</div>
                    <div className="text-xs text-gray-500">
                      {(log as Record<string, unknown>).recorder_name as string} • {new Date((log as Record<string, unknown>).recorded_at as string).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${violation ? "text-red-400" : "text-green-400"}`}>
                    {temp}°F
                  </div>
                </div>
              );
            }) : (
              <p className="text-gray-500 text-sm text-center py-4">No logs yet today</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
