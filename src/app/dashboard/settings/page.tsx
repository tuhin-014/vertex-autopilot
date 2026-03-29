export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">⚙️ Settings</h1>
      <p className="text-gray-400">Configure agent behavior, notifications, and integrations.</p>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-gray-800">
          <div><div className="font-medium">Food Safety Agent</div><div className="text-sm text-gray-500">Temp logs, certifications, corrective actions</div></div>
          <span className="px-3 py-1 bg-green-600/10 text-green-400 rounded-full text-sm">Active</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-800">
          <div><div className="font-medium">Hiring Agent</div><div className="text-sm text-gray-500">Understaffing, screening, onboarding</div></div>
          <span className="px-3 py-1 bg-green-600/10 text-green-400 rounded-full text-sm">Active</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-800">
          <div><div className="font-medium">Staffing Agent</div><div className="text-sm text-gray-500">Schedule optimization, replacements</div></div>
          <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm">Phase 2</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-800">
          <div><div className="font-medium">Spend Optimizer</div><div className="text-sm text-gray-500">Vendor monitoring, anomaly detection</div></div>
          <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm">Phase 2</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-800">
          <div><div className="font-medium">Revenue Optimizer</div><div className="text-sm text-gray-500">Weather + events + dynamic pricing</div></div>
          <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm">Phase 2</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <div><div className="font-medium">Cross-Product Intelligence</div><div className="text-sm text-gray-500">Multi-agent correlation engine</div></div>
          <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-full text-sm">Phase 2</span>
        </div>
      </div>
    </div>
  );
}
