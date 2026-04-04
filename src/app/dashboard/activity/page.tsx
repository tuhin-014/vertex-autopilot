"use client";

import { useState, useEffect } from "react";

interface TempLog {
  id: string;
  equipment: string;
  temperature: number;
  status: string;
  recorder_name: string;
  recorded_at: string;
}

interface ChecklistCompletion {
  id: string;
  completed_by: string;
  shift_date: string;
  shift_type: string;
  status: string;
  completion_pct: number;
  started_at: string;
  completed_at: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items_completed: any[];
  checklist_templates: { name: string; type: string } | null;
}

interface OrderEntry {
  id: string;
  order_number: number;
  customer_name: string;
  channel: string;
  status: string;
  total: number;
  taken_by: string;
  created_at: string;
}

type TabKey = "all" | "temps" | "checklists" | "orders";

export default function ActivityLogPage() {
  const [tempLogs, setTempLogs] = useState<TempLog[]>([]);
  const [checklists, setChecklists] = useState<ChecklistCompletion[]>([]);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/temp-logs?limit=50").then(r => r.json()).catch(() => ({})),
      fetch("/api/checklists/history").then(r => r.json()).catch(() => ({})),
      fetch("/api/orders").then(r => r.json()).catch(() => ({})),
    ]).then(([tData, cData, oData]) => {
      // Handle various API response shapes
      setTempLogs(Array.isArray(tData) ? tData : tData.logs || tData.data || []);
      setChecklists(Array.isArray(cData) ? cData : cData.completions || cData.data || []);
      setOrders(Array.isArray(oData) ? oData : oData.orders || oData.data || []);
      setLoading(false);
    });
  }, []);

  // Build unified timeline
  type TimelineEntry = {
    time: string;
    type: "temp" | "checklist" | "order";
    who: string;
    what: string;
    detail: string;
    severity: "normal" | "warning" | "critical" | "success";
  };

  const timeline: TimelineEntry[] = [];

  // Temp logs
  for (const log of tempLogs) {
    const isViolation = log.status === "violation";
    timeline.push({
      time: log.recorded_at,
      type: "temp",
      who: log.recorder_name || "Unknown",
      what: `Logged ${log.equipment}: ${log.temperature}°F`,
      detail: isViolation ? "⚠️ VIOLATION — out of safe range" : "Within safe range",
      severity: isViolation ? "critical" : "normal",
    });
  }

  // Checklists
  for (const cl of checklists) {
    const itemCount = cl.items_completed?.length || 0;
    const completedItems = cl.items_completed?.filter((i: { completed: boolean }) => i.completed).length || 0;
    if (cl.status === "completed") {
      timeline.push({
        time: cl.completed_at || cl.started_at,
        type: "checklist",
        who: cl.completed_by,
        what: `Completed "${cl.checklist_templates?.name || "Checklist"}"`,
        detail: `${completedItems}/${itemCount} items · ${cl.shift_type}`,
        severity: "success",
      });
    } else {
      timeline.push({
        time: cl.started_at,
        type: "checklist",
        who: cl.completed_by,
        what: `Started "${cl.checklist_templates?.name || "Checklist"}"`,
        detail: `${completedItems}/${itemCount} items (${cl.completion_pct}%)`,
        severity: "normal",
      });
    }
    // Add individual item timestamps
    if (cl.items_completed) {
      for (const item of cl.items_completed) {
        if (item.completed && item.completed_at) {
          timeline.push({
            time: item.completed_at,
            type: "checklist",
            who: cl.completed_by,
            what: `Checked off: "${(item.task || "").slice(0, 60)}"`,
            detail: cl.checklist_templates?.name || "Checklist",
            severity: "normal",
          });
        }
      }
    }
  }

  // Orders
  for (const order of orders) {
    timeline.push({
      time: order.created_at,
      type: "order",
      who: order.taken_by || "System",
      what: `Order #${order.order_number} — ${order.customer_name}`,
      detail: `${order.channel} · $${order.total?.toFixed(2) || "0.00"} · ${order.status}`,
      severity: "normal",
    });
  }

  // Sort by time, newest first
  timeline.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Filter
  const filtered = tab === "all" ? timeline : timeline.filter(e => e.type === tab.replace("s", "").replace("checklist", "checklist"));
  const filteredEntries = tab === "all" ? timeline :
    tab === "temps" ? timeline.filter(e => e.type === "temp") :
    tab === "checklists" ? timeline.filter(e => e.type === "checklist") :
    timeline.filter(e => e.type === "order");

  const typeIcon = (type: string) => type === "temp" ? "🌡️" : type === "checklist" ? "✅" : "📋";
  const severityColor = (s: string) =>
    s === "critical" ? "border-red-500/30 bg-red-500/5" :
    s === "warning" ? "border-yellow-500/30 bg-yellow-500/5" :
    s === "success" ? "border-green-500/30 bg-green-500/5" :
    "border-gray-800";

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading activity...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Staff Activity Log</h1>
        <p className="text-gray-400">Who did what and when — full audit trail</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{tempLogs.length}</div>
          <div className="text-sm text-gray-400 mt-1">Temp Readings</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{checklists.filter(c => c.status === "completed").length}</div>
          <div className="text-sm text-gray-400 mt-1">Checklists Done</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{orders.length}</div>
          <div className="text-sm text-gray-400 mt-1">Orders Processed</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{tempLogs.filter(t => t.status === "violation").length}</div>
          <div className="text-sm text-gray-400 mt-1">Violations</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "all", label: "All Activity", count: timeline.length },
          { key: "temps", label: "🌡️ Temps", count: timeline.filter(e => e.type === "temp").length },
          { key: "checklists", label: "✅ Checklists", count: timeline.filter(e => e.type === "checklist").length },
          { key: "orders", label: "📋 Orders", count: timeline.filter(e => e.type === "order").length },
        ] as { key: TabKey; label: string; count: number }[]).map(f => (
          <button key={f.key} onClick={() => setTab(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === f.key ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No activity found</div>
        ) : (
          filteredEntries.slice(0, 100).map((entry, i) => (
            <div key={i} className={`bg-gray-900 border rounded-xl p-4 ${severityColor(entry.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{typeIcon(entry.type)}</span>
                  <div>
                    <div className="text-sm font-medium">{entry.what}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{entry.detail}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-blue-400 font-medium">👤 {entry.who}</span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{new Date(entry.time).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 shrink-0 ml-2">{timeAgo(entry.time)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
