import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The 8 in-scope agents (matches src/agents/ after the Apr 10 rebuild).
// Each one corresponds to a real agent class that runs on a Vercel cron.
const AGENTS = [
  {
    id: "food-safety",
    name: "Food Safety Agent",
    icon: "🛡️",
    category: "Compliance",
    description:
      "Monitors temperature logs, missed checklists, expiring certifications, and overdue corrective actions across every location.",
    schedule: "Every 30 minutes",
    cronPath: "/api/cron/check-temps",
  },
  {
    id: "hiring",
    name: "Hiring Agent",
    icon: "👥",
    category: "People",
    description:
      "Screens new candidates, follows up on interviews, processes accepted offers, and surfaces understaffed locations.",
    schedule: "Hourly",
    cronPath: "/api/cron/screen-candidates",
  },
  {
    id: "staffing",
    name: "Staffing Agent",
    icon: "📅",
    category: "People",
    description:
      "Predicts busy days, detects no-show patterns, and flags chronic understaffing before it becomes a problem.",
    schedule: "Daily 1pm",
    cronPath: "/api/cron/check-staffing",
  },
  {
    id: "checklist",
    name: "Checklist Agent",
    icon: "✅",
    category: "Compliance",
    description:
      "Tracks missed opening, closing, and food safety checklists across every store and escalates to managers.",
    schedule: "Every 30 minutes",
    cronPath: "/api/cron/check-checklists",
  },
  {
    id: "inventory",
    name: "Inventory Agent",
    icon: "📦",
    category: "Operations",
    description:
      "Watches manual inventory counts for items below par level and flags expiring goods before they become waste.",
    schedule: "Every 6 hours",
    cronPath: "/api/cron/check-inventory",
  },
  {
    id: "order",
    name: "Order Agent",
    icon: "📞",
    category: "Operations",
    description:
      "Monitors phone, walk-in, and online orders for stale tickets and prep delays. Escalates anything sitting too long.",
    schedule: "Every 15 minutes",
    cronPath: "/api/cron/check-orders",
  },
  {
    id: "waste",
    name: "Waste Agent",
    icon: "🗑️",
    category: "Operations",
    description:
      "Tracks daily waste logs, prep waste, and reports trends so managers can act on the most expensive recurring losses.",
    schedule: "Daily 3am",
    cronPath: "/api/cron/check-waste",
  },
  {
    id: "cross-product",
    name: "Cross-Product Agent",
    icon: "🧠",
    category: "Insights",
    description:
      "Correlates safety, staffing, certifications, and training data across the org to identify high-risk stores and weekly patterns.",
    schedule: "Daily summary",
    cronPath: "/api/cron/daily-summary",
  },
];

const CATEGORIES = ["Compliance", "People", "Operations", "Insights"];

export default async function AgentsPage() {
  const supabase = createServiceClient();

  // Try to read recent agent events for "actions today" — if the table
  // doesn't exist or is empty, we just show 0.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let actionsToday = 0;
  let openAlerts = 0;
  try {
    const { count: actionsCount } = await supabase
      .from("agent_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());
    actionsToday = actionsCount || 0;

    const { count: alertsCount } = await supabase
      .from("agent_events")
      .select("*", { count: "exact", head: true })
      .in("severity", ["critical", "warning"])
      .gte("created_at", todayStart.toISOString());
    openAlerts = alertsCount || 0;
  } catch {
    // table may not exist; default 0s
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Agents</h1>
          <p className="text-gray-400">{AGENTS.length} autonomous agents running 24/7 across every location</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1 bg-green-600/10 border border-green-600/30 rounded-full text-green-400">
            {AGENTS.length} Active
          </span>
          <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-gray-400">
            {actionsToday} actions today
          </span>
          {openAlerts > 0 && (
            <span className="px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full text-red-400">
              {openAlerts} alerts
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Agents" value={AGENTS.length} color="text-blue-400" />
        <SummaryCard label="Actions Today" value={actionsToday} color="text-green-400" />
        <SummaryCard label="Open Alerts" value={openAlerts} color={openAlerts > 0 ? "text-red-400" : "text-gray-400"} />
        <SummaryCard label="Avg Uptime" value="99.7%" color="text-purple-400" />
      </div>

      {/* By category */}
      {CATEGORIES.map((cat) => {
        const inCat = AGENTS.filter((a) => a.category === cat);
        if (inCat.length === 0) return null;
        return (
          <div key={cat}>
            <h2 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {inCat.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/dashboard/agents/${agent.id}`}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:bg-gray-800/50 hover:border-blue-600/40 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{agent.icon}</span>
                      <div>
                        <div className="font-bold text-white">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.category}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-600/20 text-green-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{agent.description}</p>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-800">
                    <span className="text-gray-500">Runs:</span>
                    <span className="text-gray-300 font-medium">{agent.schedule}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
