export default function SettingsPage() {
  const agents = [
    { name: "Food Safety Autopilot", desc: "Temp logs, certifications, corrective actions, pattern detection", status: "active", checks: "Every 30 min + daily" },
    { name: "Hiring Autopilot", desc: "Understaffing, AI screening, text-to-apply, interview follow-ups, onboarding", status: "active", checks: "Daily + hourly screening" },
    { name: "Staffing Agent", desc: "Busy day predictions, schedule optimization, chronic understaffing detection", status: "active", checks: "Daily" },
    { name: "Revenue Optimizer", desc: "Weather-based recommendations, day-of-week patterns, promotion suggestions", status: "active", checks: "Daily" },
    { name: "Spend Optimizer", desc: "Corrective action cost tracking, spending anomaly detection, fine risk alerts", status: "active", checks: "Every 2 hours" },
    { name: "Cross-Product Intelligence", desc: "Safety↔staffing correlation, training gaps, high-risk store identification, weekly insights", status: "active", checks: "Weekly + on-demand" },
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

      {/* Integrations */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">🔌 Integrations</h2>
        <div className="space-y-3">
          {[
            { name: "Twilio SMS", status: "connected", detail: "(478) 800-7647" },
            { name: "Resend Email", status: "connected", detail: "noreply@vertexlabsolutions.com" },
            { name: "Supabase", status: "connected", detail: "iatdvwzenpjrwwotlewg" },
            { name: "Open-Meteo Weather", status: "connected", detail: "Raleigh, NC" },
            { name: "Indeed/ZipRecruiter", status: "planned", detail: "Job posting API — Phase 3" },
            { name: "TRAY POS", status: "planned", detail: "Sales data — Phase 3" },
          ].map((int, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div>
                <span className="text-sm font-medium text-gray-300">{int.name}</span>
                <span className="text-xs text-gray-600 ml-2">{int.detail}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                int.status === "connected" ? "bg-green-600/10 text-green-400" : "bg-gray-700 text-gray-400"
              }`}>
                {int.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">⏰ Scheduled Jobs (6 active)</h2>
        <div className="space-y-2 text-sm">
          {[
            { path: "/api/cron/check-temps", schedule: "Every 30 minutes", agent: "Food Safety" },
            { path: "/api/cron/check-certs", schedule: "Daily at 7:00 AM EST", agent: "Food Safety" },
            { path: "/api/cron/check-corrective", schedule: "Every 2 hours", agent: "Food Safety + Spend" },
            { path: "/api/cron/check-staffing", schedule: "Daily at 8:00 AM EST", agent: "Hiring + Staffing" },
            { path: "/api/cron/screen-candidates", schedule: "Every hour", agent: "Hiring" },
            { path: "/api/cron/daily-summary", schedule: "Daily at 9:00 PM EST", agent: "All Agents" },
          ].map((job, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div>
                <code className="text-xs bg-gray-800 px-2 py-0.5 rounded text-blue-400">{job.path}</code>
                <span className="text-gray-500 ml-2">{job.agent}</span>
              </div>
              <span className="text-gray-400">{job.schedule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">🚀 Quick Actions</h2>
        <div className="flex gap-3">
          <a href="/api/agents/run-all" target="_blank" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">
            ▶ Run All 6 Agents
          </a>
          <a href="/api/cron/daily-summary" target="_blank" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
            📧 Send Daily Summary
          </a>
          <a href="/api/seed" target="_blank" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
            🌱 Re-Seed Data
          </a>
          <a href="/api/seed-hiring" target="_blank" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition">
            👥 Seed Candidates
          </a>
        </div>
      </div>
    </div>
  );
}
