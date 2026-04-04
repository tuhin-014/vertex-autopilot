"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any;
  location_id: string | null;
  deadline_minutes: number | null;
}

interface ActiveChecklist {
  id: string;
  completed_by: string;
  status: string;
  completion_pct: number;
  shift_type: string;
  checklist_templates: { name: string; type: string } | null;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  channel: string;
  status: string;
  total: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  created_at: string;
}

type Tab = "home" | "checklists" | "temps" | "orders";

export default function StaffPortal() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [staffName, setStaffName] = useState("");
  const [nameSet, setNameSet] = useState(false);

  // Load saved name
  useEffect(() => {
    const saved = localStorage.getItem("staff-name");
    if (saved) { setStaffName(saved); setNameSet(true); }
  }, []);

  const saveName = () => {
    if (!staffName.trim()) return;
    localStorage.setItem("staff-name", staffName.trim());
    setNameSet(true);
  };

  if (!nameSet) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-2xl font-bold mb-2">Staff Portal</h1>
          <p className="text-gray-400 mb-6">Enter your name to get started</p>
          <input
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-lg mb-4"
            autoFocus
          />
          <button onClick={saveName} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-lg transition">
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="font-bold text-lg">🏪 Staff Portal</h1>
          <p className="text-xs text-gray-400">Hi, {staffName}</p>
        </div>
        <button onClick={() => { localStorage.removeItem("staff-name"); setNameSet(false); }} className="text-xs text-gray-500 hover:text-white">
          Switch User
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {tab === "home" && <HomeTab staffName={staffName} setTab={setTab} />}
        {tab === "checklists" && <ChecklistsTab staffName={staffName} />}
        {tab === "temps" && <TempsTab staffName={staffName} />}
        {tab === "orders" && <OrdersTab />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-2 py-2 flex justify-around z-50">
        {([
          { key: "home", icon: "🏠", label: "Home" },
          { key: "checklists", icon: "✅", label: "Checklists" },
          { key: "temps", icon: "🌡️", label: "Temps" },
          { key: "orders", icon: "📋", label: "Orders" },
        ] as { key: Tab; icon: string; label: string }[]).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex flex-col items-center px-4 py-1 rounded-lg transition ${
              tab === item.key ? "text-blue-400" : "text-gray-500"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============ HOME TAB ============ */
function HomeTab({ staffName, setTab }: { staffName: string; setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState({ activeOrders: 0, pendingChecklists: 0, tempsDue: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/checklists/templates").then(r => r.json()),
    ]).then(([orders, templates]) => {
      const active = (orders.orders || []).filter((o: Order) => ["new", "preparing", "ready"].includes(o.status)).length;
      setStats({ activeOrders: active, pendingChecklists: (templates.templates || []).length, tempsDue: 5 });
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <div className="text-4xl mb-2">👋</div>
        <h2 className="text-xl font-bold">Welcome, {staffName}!</h2>
        <p className="text-gray-400 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setTab("checklists")} className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-5 text-left hover:bg-blue-600/30 transition">
          <div className="text-3xl mb-2">✅</div>
          <div className="font-bold">Checklists</div>
          <div className="text-xs text-gray-400 mt-1">{stats.pendingChecklists} templates available</div>
        </button>
        <button onClick={() => setTab("temps")} className="bg-red-600/20 border border-red-500/30 rounded-2xl p-5 text-left hover:bg-red-600/30 transition">
          <div className="text-3xl mb-2">🌡️</div>
          <div className="font-bold">Log Temps</div>
          <div className="text-xs text-gray-400 mt-1">{stats.tempsDue} stations to check</div>
        </button>
        <button onClick={() => setTab("orders")} className="bg-green-600/20 border border-green-500/30 rounded-2xl p-5 text-left hover:bg-green-600/30 transition">
          <div className="text-3xl mb-2">📋</div>
          <div className="font-bold">Orders</div>
          <div className="text-xs text-gray-400 mt-1">{stats.activeOrders} active now</div>
        </button>
        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-2xl p-5 text-left">
          <div className="text-3xl mb-2">📢</div>
          <div className="font-bold">Announcements</div>
          <div className="text-xs text-gray-400 mt-1">No new updates</div>
        </div>
      </div>
    </div>
  );
}

/* ============ CHECKLISTS TAB ============ */
function ChecklistsTab({ staffName }: { staffName: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [active, setActive] = useState<ActiveChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/checklists/templates").then(r => r.json()),
      fetch("/api/checklists/history?status=in_progress").then(r => r.json()).catch(() => ({ completions: [] })),
    ]).then(([tData, cData]) => {
      setTemplates(tData.templates || []);
      setActive(cData.completions || []);
      setLoading(false);
    });
  }, []);

  const startChecklist = async (tpl: Template) => {
    setStarting(tpl.id);
    const res = await fetch("/api/checklists/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: tpl.id,
        location_id: tpl.location_id,
        completed_by: staffName,
        shift_type: tpl.type,
        template_items: tpl.items,
      }),
    });
    const data = await res.json();
    setStarting(null);
    if (data.completion) {
      window.location.href = `/staff/checklist/${data.completion.id}`;
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400 animate-pulse">Loading...</div>;

  const typeIcon = (type: string) => type === "opening" ? "🌅" : type === "closing" ? "🌙" : "🛡️";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">✅ Checklists</h2>

      {/* Active checklists */}
      {active.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase font-medium mb-2">In Progress</p>
          {active.map(c => (
            <a key={c.id} href={`/staff/checklist/${c.id}`}
              className="block bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.checklist_templates?.name || "Checklist"}</div>
                  <div className="text-xs text-gray-400">{c.completed_by}</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 font-bold">{c.completion_pct}%</div>
                  <div className="text-xs text-gray-500">Continue →</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Start new */}
      <p className="text-xs text-gray-400 uppercase font-medium">Start New Checklist</p>
      <div className="space-y-2">
        {templates.map(tpl => {
          const itemCount = typeof tpl.items === "string" ? JSON.parse(tpl.items).length : Array.isArray(tpl.items) ? tpl.items.length : 0;
          return (
            <button key={tpl.id} onClick={() => startChecklist(tpl)} disabled={starting === tpl.id}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-left hover:border-gray-600 transition disabled:opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeIcon(tpl.type)}</span>
                  <div>
                    <div className="font-medium">{tpl.name}</div>
                    <div className="text-xs text-gray-500">{itemCount} items{tpl.deadline_minutes ? ` · ${tpl.deadline_minutes}min` : ""}</div>
                  </div>
                </div>
                <span className="text-gray-500 text-sm">{starting === tpl.id ? "Starting..." : "Start →"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ TEMPS TAB ============ */
function TempsTab({ staffName }: { staffName: string }) {
  const [equipment] = useState([
    { name: "Walk-In Cooler", range: "32-41°F", icon: "❄️" },
    { name: "Walk-In Freezer", range: "Below 0°F", icon: "🧊" },
    { name: "Prep Line Cooler", range: "32-41°F", icon: "❄️" },
    { name: "Hot Hold Station", range: "Above 135°F", icon: "🔥" },
    { name: "Grill Station", range: "Above 135°F", icon: "🔥" },
  ]);
  const [temps, setTemps] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);

  const logTemp = async (eq: string) => {
    const temp = parseFloat(temps[eq] || "");
    if (isNaN(temp)) return;
    setSubmitting(true);
    try {
      await fetch("/api/temp-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipment: eq, temperature: temp, recorded_by: staffName }),
      });
      setSubmitted(prev => [...prev, eq]);
      setTemps(prev => ({ ...prev, [eq]: "" }));
    } catch {}
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">🌡️ Temperature Log</h2>
      <p className="text-sm text-gray-400">Record temperatures for each station</p>

      <div className="space-y-3">
        {equipment.map(eq => (
          <div key={eq.name} className={`bg-gray-900 border rounded-xl p-4 ${submitted.includes(eq.name) ? "border-green-500/30" : "border-gray-800"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{eq.icon}</span>
                <div>
                  <div className="font-medium text-sm">{eq.name}</div>
                  <div className="text-xs text-gray-500">Safe range: {eq.range}</div>
                </div>
              </div>
              {submitted.includes(eq.name) && <span className="text-green-400 text-sm font-medium">✅ Logged</span>}
            </div>
            {!submitted.includes(eq.name) && (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  value={temps[eq.name] || ""}
                  onChange={(e) => setTemps(prev => ({ ...prev, [eq.name]: e.target.value }))}
                  placeholder="°F"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                />
                <button onClick={() => logTemp(eq.name)} disabled={submitting || !temps[eq.name]}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition">
                  Log
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {submitted.length === equipment.length && (
        <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <div className="font-bold text-green-400">All temps logged!</div>
          <div className="text-xs text-gray-400 mt-1">Great work, {staffName}</div>
        </div>
      )}
    </div>
  );
}

/* ============ ORDERS TAB ============ */
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setLoading(false); });
    const interval = setInterval(() => {
      fetch("/api/orders").then(r => r.json()).then(d => setOrders(d.orders || []));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch("/api/orders");
    const d = await res.json();
    setOrders(d.orders || []);
  };

  const active = orders.filter(o => ["new", "preparing", "ready"].includes(o.status));
  const channelIcon = (ch: string) => ch === "phone" ? "📞" : ch === "walk-in" ? "🚶" : ch === "online" ? "💻" : ch === "doordash" ? "🚗" : ch === "ubereats" ? "🛵" : "📋";

  if (loading) return <div className="text-center py-12 text-gray-400 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">📋 Active Orders</h2>
        <span className="text-xs text-gray-500">Auto-refreshes</span>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">🎉</div>
          <div>No active orders</div>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(order => {
            const nextStatus = order.status === "new" ? "preparing" : order.status === "preparing" ? "ready" : "completed";
            const nextLabel = order.status === "new" ? "👨‍🍳 Start Prep" : order.status === "preparing" ? "✅ Mark Ready" : "✓ Complete";
            const statusColor = order.status === "new" ? "border-orange-500/30 bg-orange-500/5" : order.status === "preparing" ? "border-blue-500/30 bg-blue-500/5" : "border-green-500/30 bg-green-500/5";
            const statusLabel = order.status === "new" ? "🔔 New" : order.status === "preparing" ? "👨‍🍳 Preparing" : "✅ Ready";

            return (
              <div key={order.id} className={`border rounded-xl p-4 ${statusColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">#{order.order_number}</span>
                    <span>{channelIcon(order.channel)}</span>
                    <span className="text-sm">{order.customer_name}</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-800">{statusLabel}</span>
                </div>

                <div className="text-sm text-gray-400 mb-3">
                  {order.items.map((i: { name?: string; quantity?: number; qty?: number }) =>
                    `${i.quantity || i.qty || 1}x ${i.name || "Item"}`
                  ).join(", ")}
                  {order.total > 0 && <span className="text-green-400 ml-2 font-medium">${order.total.toFixed(2)}</span>}
                </div>

                <button onClick={() => updateStatus(order.id, nextStatus)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition">
                  {nextLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
