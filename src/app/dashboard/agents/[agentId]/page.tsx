import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AGENTS: Record<
  string,
  {
    name: string;
    icon: string;
    category: string;
    description: string;
    schedule: string;
    cronPath: string;
    capabilities: string[];
    eventTypes?: string[];
  }
> = {
  "food-safety": {
    name: "Food Safety Agent",
    icon: "🛡️",
    category: "Compliance",
    description:
      "Monitors temperature logs, missed checklists, expiring certifications, and overdue corrective actions across every location.",
    schedule: "Every 30 minutes",
    cronPath: "/api/cron/check-temps",
    capabilities: [
      "Detect temperature logs that fall out of safe range",
      "Flag missed temp checks per equipment type",
      "Alert on expiring food handler certifications",
      "Escalate overdue corrective actions to managers",
    ],
    eventTypes: ["temp_out_of_range", "missed_temp_log", "cert_expiring", "corrective_overdue"],
  },
  hiring: {
    name: "Hiring Agent",
    icon: "👥",
    category: "People",
    description:
      "Screens new candidates, follows up on interviews, processes accepted offers, and surfaces understaffed locations.",
    schedule: "Hourly",
    cronPath: "/api/cron/screen-candidates",
    capabilities: [
      "Score new candidates against role requirements",
      "Auto-followup interview scheduling via SMS",
      "Process accepted offers and trigger onboarding",
      "Surface stores running below staffing target",
    ],
  },
  staffing: {
    name: "Staffing Agent",
    icon: "📅",
    category: "People",
    description:
      "Predicts busy days, detects no-show patterns, and flags chronic understaffing before it becomes a problem.",
    schedule: "Daily 1pm",
    cronPath: "/api/cron/check-staffing",
    capabilities: [
      "Predict busy days from historical traffic",
      "Detect no-show patterns by employee",
      "Flag chronic understaffing per shift type",
    ],
  },
  checklist: {
    name: "Checklist Agent",
    icon: "✅",
    category: "Compliance",
    description:
      "Tracks missed opening, closing, and food safety checklists across every store and escalates to managers.",
    schedule: "Every 30 minutes",
    cronPath: "/api/cron/check-checklists",
    capabilities: [
      "Track every required daily checklist per location",
      "Escalate missed checklists to store + area managers",
      "Score completed checklists and trend by store",
    ],
  },
  inventory: {
    name: "Inventory Agent",
    icon: "📦",
    category: "Operations",
    description:
      "Watches manual inventory counts for items below par level and flags expiring goods before they become waste.",
    schedule: "Every 6 hours",
    cronPath: "/api/cron/check-inventory",
    capabilities: [
      "Compare current stock against par levels",
      "Flag items expiring within 48 hours",
      "Trend stock movement by category",
    ],
  },
  order: {
    name: "Order Agent",
    icon: "📞",
    category: "Operations",
    description:
      "Monitors phone, walk-in, and online orders for stale tickets and prep delays. Escalates anything sitting too long.",
    schedule: "Every 15 minutes",
    cronPath: "/api/cron/check-orders",
    capabilities: [
      "Detect orders sitting too long without progress",
      "Alert on prep delays vs target ticket time",
      "Roll up channel mix and prep performance",
    ],
  },
  waste: {
    name: "Waste Agent",
    icon: "🗑️",
    category: "Operations",
    description:
      "Tracks daily waste logs, prep waste, and reports trends so managers can act on the most expensive recurring losses.",
    schedule: "Daily 3am",
    cronPath: "/api/cron/check-waste",
    capabilities: [
      "Track daily waste logs by category",
      "Surface top recurring waste items by cost",
      "Flag locations trending above waste target",
    ],
  },
  "cross-product": {
    name: "Cross-Product Agent",
    icon: "🧠",
    category: "Insights",
    description:
      "Correlates safety, staffing, certifications, and training data across the org to identify high-risk stores and weekly patterns.",
    schedule: "Daily summary",
    cronPath: "/api/cron/daily-summary",
    capabilities: [
      "Correlate safety scores with staffing levels",
      "Cross-reference training gaps with incidents",
      "Identify highest-risk stores week over week",
      "Generate weekly insight digest for area managers",
    ],
  },
};

type Props = { params: Promise<{ agentId: string }> };

export default async function AgentDetailPage({ params }: Props) {
  const { agentId } = await params;
  const agent = AGENTS[agentId];
  if (!agent) notFound();

  const supabase = createServiceClient();

  // Try to fetch recent events for this agent type
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let recentEvents: Array<{
    id: string;
    severity: string | null;
    description: string | null;
    created_at: string;
  }> = [];

  try {
    const { data } = await supabase
      .from("agent_events")
      .select("id, severity, description, created_at")
      .eq("agent_type", agentId.replace("-", "_"))
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(20);
    recentEvents = data || [];
  } catch {
    // table may not exist yet
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/agents" className="hover:text-white transition">
          AI Agents
        </Link>
        <span>/</span>
        <span className="text-gray-300">{agent.name}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{agent.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
            <p className="text-gray-400 text-sm">{agent.category} · runs {agent.schedule.toLowerCase()}</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-600/20 text-green-400 border border-green-600/30">
          ● Active
        </span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-2 text-white">What this agent does</h2>
        <p className="text-sm text-gray-300 mb-4">{agent.description}</p>
        <ul className="space-y-2 text-sm text-gray-400">
          {agent.capabilities.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4 text-white">Recent Activity (24h)</h2>
        {recentEvents.length === 0 && (
          <p className="text-sm text-gray-500">
            No events logged in the last 24 hours. The agent runs on schedule and only logs events when something needs attention.
          </p>
        )}
        <div className="space-y-2">
          {recentEvents.map((e) => (
            <div key={e.id} className="flex items-start gap-3 bg-gray-800/40 rounded-lg px-3 py-2">
              <span className="mt-0.5">
                {e.severity === "critical"
                  ? "🔴"
                  : e.severity === "warning"
                    ? "🟡"
                    : e.severity === "info"
                      ? "🔵"
                      : "🟢"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">{e.description || "(no description)"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(e.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
