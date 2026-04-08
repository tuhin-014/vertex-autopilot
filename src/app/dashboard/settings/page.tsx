"use client";

import { useEffect, useState } from "react";

interface NotifPref {
  id: string;
  location_id: string;
  contact_name: string;
  contact_role: string;
  phone: string;
  email: string;
  receive_critical: boolean;
  receive_warning: boolean;
  receive_info: boolean;
  receive_daily_summary: boolean;
  locations?: { name: string };
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<NotifPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then(r => r.json())
      .then(d => { setPrefs(d.data || []); setLoading(false); });
  }, []);

  async function togglePref(id: string, field: string, value: boolean) {
    setSaving(id);
    await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    setPrefs(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    setSaving(null);
  }

  const agents = [
    { name: "🛡️ Food Safety", desc: "Temp logs, certifications, corrective actions", checks: "Every 30 min + daily" },
    { name: "👥 Hiring", desc: "AI screening, text-to-apply, interviews, offers, onboarding", checks: "Daily + hourly" },
    { name: "📊 Staffing", desc: "Busy day predictions, no-show patterns, schedule optimization", checks: "Daily" },
    { name: "📈 Revenue Optimizer", desc: "Weather impact, day-of-week patterns, promotion suggestions", checks: "Daily" },
    { name: "💸 Spend Optimizer", desc: "Spending anomalies, overdue cost tracking, fine risk alerts", checks: "Every 2 hours" },
    { name: "🔗 Cross-Product Intelligence", desc: "Safety↔staffing correlation, training gaps, high-risk stores, weekly insights", checks: "Weekly" },
    { name: "💰 Accountant", desc: "Financial health monitoring, P&L tracking, budget alerts", checks: "Daily" },
    { name: "📋 Checklist Manager", desc: "Missed checklist alerts, shift handoff tracking", checks: "Every 30 min" },
    { name: "📦 Inventory", desc: "Below-par stock alerts, expiring items, auto reorder suggestions", checks: "Every 6 hours" },
    { name: "🧾 Invoice Manager", desc: "Overdue invoice alerts, vendor price anomaly detection", checks: "Daily" },
    { name: "📢 Marketing", desc: "Slow day promos, campaign management, social content", checks: "Daily" },
    { name: "📞 Order Manager", desc: "Stale order detection, queue monitoring, issue tracking", checks: "Every 15 min" },
    { name: "⭐ Review Manager", desc: "Sentiment analysis, AI response generation, reputation monitoring", checks: "Hourly" },
    { name: "🗑️ Waste Manager", desc: "Waste tracking, prep target optimization, cost reduction", checks: "Daily" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">⚙️ Settings</h1>
      <p className="text-gray-400">Configure agent behavior, notifications, and integrations.</p>

      {/* Agent Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">🤖 AI Agents ({agents.length} active)</h2>
        <div className="space-y-4">
          {agents.map((agent, i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-gray-800 last:border-0">
              <div className="flex-1">
                <div className="font-medium">{agent.name}</div>
                <div className="text-sm text-gray-500">{agent.desc}</div>
                <div className="text-xs text-gray-600 mt-1">Schedule: {agent.checks}</div>
              </div>
              <span className="px-3 py-1 bg-green-600/10 text-green-400 rounded-full text-sm">Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">🔔 Notification Preferences</h2>
        <p className="text-sm text-gray-500 mb-4">Configure who receives alerts per store. Toggle SMS/email by severity level.</p>

        {loading ? (
          <p className="text-gray-500">Loading preferences...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left p-2">Store</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-center p-2">🔴 Critical</th>
                  <th className="text-center p-2">🟡 Warning</th>
                  <th className="text-center p-2">🟢 Info</th>
                  <th className="text-center p-2">📧 Daily</th>
                </tr>
              </thead>
              <tbody>
                {prefs.slice(0, 15).map(p => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-2 text-gray-300 truncate max-w-32">{p.locations?.name || "—"}</td>
                    <td className="p-2 text-gray-400">{p.contact_name}</td>
                    <td className="p-2 text-gray-500 text-xs">{p.phone || "—"}</td>
                    {(["receive_critical", "receive_warning", "receive_info", "receive_daily_summary"] as const).map(field => (
                      <td key={field} className="p-2 text-center">
                        <button
                          onClick={() => togglePref(p.id, field, !p[field])}
                          disabled={saving === p.id}
                          className={`w-8 h-5 rounded-full transition relative ${
                            p[field] ? "bg-blue-600" : "bg-gray-700"
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                            p[field] ? "left-3.5" : "left-0.5"
                          }`} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integrations */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">🔌 Integrations</h2>
        <div className="space-y-3">
          {[
            { name: "Twilio SMS", status: "connected", detail: "(478) 800-7647" },
            { name: "Resend Email", status: "connected", detail: "noreply@vertexlabsolutions.com" },
            { name: "Supabase", status: "connected", detail: "iatdvwzenpjrwwotlewg" },
            { name: "Open-Meteo Weather", status: "connected", detail: "Raleigh, NC" },
            { name: "Indeed/ZipRecruiter", status: "coming_soon", detail: "Job posting API — awaiting API credentials" },
            { name: "Google Calendar", status: "coming_soon", detail: "Interview scheduling — OAuth setup pending" },
            { name: "TRAY POS", status: "coming_soon", detail: "Sales data — partner agreement in progress" },
          ].map((int, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div>
                <span className="text-sm font-medium text-gray-300">{int.name}</span>
                <span className="text-xs text-gray-600 ml-2">{int.detail}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                int.status === "connected" ? "bg-green-600/10 text-green-400" :
                int.status === "coming_soon" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                "bg-gray-700 text-gray-400"
              }`}>
                {int.status === "coming_soon" ? "Coming Soon" : int.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">🚀 Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/api/agents/run-all" target="_blank" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">▶ Run All 14 Agents</a>
          <a href="/api/demo/simulate" target="_blank" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition">🎬 Run Demo Simulation</a>
          <a href="/api/reports/regional" target="_blank" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">📄 Regional Report (PDF)</a>
          <a href="/api/cron/daily-summary" target="_blank" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">📧 Send Daily Summary</a>
          <a href="/api/seed" target="_blank" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">🌱 Re-Seed Data</a>
        </div>
      </div>
    </div>
  );
}
