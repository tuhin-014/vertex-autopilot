"use client";

import { useState, useEffect, useCallback } from "react";

interface Employee {
  id: string;
  name: string;
  role: string;
  status: string;
  phone: string;
}

interface StaffingTarget {
  role: string;
  target_count: number;
  min_count: number;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  channel: string;
  status: string;
  total: number;
  taken_by: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  created_at: string;
}

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
  status: string;
  completion_pct: number;
  shift_type: string;
  checklist_templates: { name: string; type: string } | null;
}

interface ClockEntry {
  employeeId: string;
  clockedIn: boolean;
  clockInTime: string | null;
  station: string;
}

export default function ShiftLeadDashboard() {
  const [shiftLead, setShiftLead] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [targets, setTargets] = useState<StaffingTarget[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tempLogs, setTempLogs] = useState<TempLog[]>([]);
  const [checklists, setChecklists] = useState<ChecklistCompletion[]>([]);
  const [clockEntries, setClockEntries] = useState<Record<string, ClockEntry>>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem("shift-lead-name");
    if (saved) { setShiftLead(saved); setNameSet(true); }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load clock entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("clock-entries");
    if (saved) {
      try { setClockEntries(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveClockEntries = (entries: Record<string, ClockEntry>) => {
    setClockEntries(entries);
    localStorage.setItem("clock-entries", JSON.stringify(entries));
  };

  const fetchAll = useCallback(async () => {
    try {
      const [empRes, targetRes, orderRes, tempRes, checkRes] = await Promise.all([
        fetch("/api/employees").then(r => r.json()).catch(() => ({})),
        fetch("/api/staffing-targets").then(r => r.json()).catch(() => ({})),
        fetch("/api/orders").then(r => r.json()).catch(() => ({})),
        fetch("/api/temp-logs?limit=20").then(r => r.json()).catch(() => ({})),
        fetch("/api/checklists/history?status=in_progress").then(r => r.json()).catch(() => ({})),
      ]);
      setEmployees(Array.isArray(empRes) ? empRes : empRes.employees || empRes.data || []);
      setTargets(Array.isArray(targetRes) ? targetRes : targetRes.targets || targetRes.data || []);
      setOrders(Array.isArray(orderRes) ? orderRes : orderRes.orders || orderRes.data || []);
      setTempLogs(Array.isArray(tempRes) ? tempRes : tempRes.logs || tempRes.data || []);
      setChecklists(Array.isArray(checkRes) ? checkRes : checkRes.completions || checkRes.data || []);
      setLoading(false);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => {
    if (nameSet) {
      fetchAll();
      const interval = setInterval(fetchAll, 30000);
      return () => clearInterval(interval);
    }
  }, [nameSet, fetchAll]);

  const saveName = () => {
    if (!shiftLead.trim()) return;
    localStorage.setItem("shift-lead-name", shiftLead.trim());
    setNameSet(true);
  };

  const toggleClock = (emp: Employee) => {
    const entry = clockEntries[emp.id];
    const updated = { ...clockEntries };
    if (entry?.clockedIn) {
      delete updated[emp.id];
    } else {
      updated[emp.id] = {
        employeeId: emp.id,
        clockedIn: true,
        clockInTime: new Date().toISOString(),
        station: emp.role,
      };
    }
    saveClockEntries(updated);
  };

  const updateStation = (empId: string, station: string) => {
    const updated = { ...clockEntries };
    if (updated[empId]) {
      updated[empId].station = station;
      saveClockEntries(updated);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  if (!nameSet) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-bold mb-2">Shift Lead Dashboard</h1>
          <p className="text-gray-400 mb-6">Enter your name to start your shift</p>
          <input value={shiftLead} onChange={(e) => setShiftLead(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            placeholder="Your name" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-lg mb-4" autoFocus />
          <button onClick={saveName} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-lg transition">Start Shift →</button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading shift data...</div></div>;

  // Computed data
  const clockedIn = Object.values(clockEntries).filter(e => e.clockedIn);
  const activeOrders = orders.filter(o => ["new", "preparing", "ready"].includes(o.status));
  const newOrders = orders.filter(o => o.status === "new");

  // Today's temps
  const today = new Date().toISOString().split("T")[0];
  const todayTemps = tempLogs.filter(t => t.recorded_at?.startsWith(today));
  const equipmentList = ["Walk-In Cooler", "Walk-In Freezer", "Prep Line Cooler", "Hot Hold Station", "Grill Station"];
  const tempsLogged = equipmentList.filter(eq => todayTemps.some(t => t.equipment === eq));
  const tempsOverdue = equipmentList.filter(eq => !todayTemps.some(t => t.equipment === eq));
  const violations = todayTemps.filter(t => t.status === "violation");

  // Staffing
  const roleGroups: Record<string, { employees: Employee[]; clockedIn: ClockEntry[]; target: number; min: number }> = {};
  const normalizeRole = (r: string) => r.toLowerCase().replace(/\s+/g, " ").trim();
  const roleMap: Record<string, string> = {
    "head chef": "cook", "sous chef": "cook", "line cook": "cook", "prep cook": "cook",
    "server / foh lead": "server",
  };

  for (const t of targets) {
    roleGroups[t.role] = { employees: [], clockedIn: [], target: t.target_count, min: t.min_count };
  }

  for (const emp of employees) {
    const mapped = roleMap[normalizeRole(emp.role)] || normalizeRole(emp.role);
    if (!roleGroups[mapped]) roleGroups[mapped] = { employees: [], clockedIn: [], target: 0, min: 0 };
    roleGroups[mapped].employees.push(emp);
    if (clockEntries[emp.id]?.clockedIn) {
      roleGroups[mapped].clockedIn.push(clockEntries[emp.id]);
    }
  }

  const totalTarget = Object.values(roleGroups).reduce((s, g) => s + g.target, 0);
  const totalClockedIn = clockedIn.length;
  const shortStaffed = Object.entries(roleGroups).filter(([, g]) => g.clockedIn.length < g.min);

  const shiftHours = () => {
    const h = currentTime.getHours();
    if (h >= 5 && h < 14) return "Morning";
    if (h >= 14 && h < 22) return "Evening";
    return "Night";
  };

  const roleIcon = (role: string) => {
    const icons: Record<string, string> = { cook: "🍳", server: "🍽️", host: "📋", dishwasher: "🧹", manager: "👔" };
    return icons[role] || "👤";
  };

  const channelIcon = (ch: string) => ch === "phone" ? "📞" : ch === "walk-in" ? "🚶" : ch === "online" ? "💻" : ch === "doordash" ? "🚗" : ch === "ubereats" ? "🛵" : "📋";

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">📋 Shift Lead Dashboard</h1>
            <p className="text-xs text-gray-400">{shiftHours()} Shift · Lead: {shiftLead} · {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="flex items-center gap-3">
            {newOrders.length > 0 && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                🔔 {newOrders.length} NEW
              </span>
            )}
            <button onClick={() => { localStorage.removeItem("shift-lead-name"); setNameSet(false); }} className="text-xs text-gray-500 hover:text-white">End Shift</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className={`bg-gray-900 border rounded-xl p-3 text-center ${totalClockedIn < totalTarget ? "border-yellow-500/30" : "border-green-500/30"}`}>
            <div className="text-2xl font-bold">{totalClockedIn}/{totalTarget}</div>
            <div className="text-xs text-gray-400">Staff On Shift</div>
          </div>
          <div className={`bg-gray-900 border rounded-xl p-3 text-center ${newOrders.length > 0 ? "border-red-500/30 animate-pulse" : "border-gray-800"}`}>
            <div className="text-2xl font-bold">{activeOrders.length}</div>
            <div className="text-xs text-gray-400">Active Orders</div>
          </div>
          <div className={`bg-gray-900 border rounded-xl p-3 text-center ${tempsOverdue.length > 0 ? "border-yellow-500/30" : "border-green-500/30"}`}>
            <div className="text-2xl font-bold">{tempsLogged.length}/{equipmentList.length}</div>
            <div className="text-xs text-gray-400">Temps Logged</div>
          </div>
          <div className={`bg-gray-900 border rounded-xl p-3 text-center ${violations.length > 0 ? "border-red-500/30" : "border-green-500/30"}`}>
            <div className="text-2xl font-bold text-red-400">{violations.length}</div>
            <div className="text-xs text-gray-400">Violations</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{checklists.length}</div>
            <div className="text-xs text-gray-400">Open Checklists</div>
          </div>
        </div>

        {/* Short staffed alert */}
        {shortStaffed.length > 0 && (
          <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-4">
            <div className="font-bold text-red-400 text-sm mb-1">⚠️ Short Staffed</div>
            <div className="text-sm text-gray-300">
              {shortStaffed.map(([role, g]) => (
                <span key={role} className="mr-3">{roleIcon(role)} {role}: {g.clockedIn.length}/{g.min} min needed</span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT: Staff on shift */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <h2 className="font-bold text-sm">👥 Staff On Shift</h2>
                <span className="text-xs text-gray-500">{totalClockedIn} clocked in</span>
              </div>

              {Object.entries(roleGroups).map(([role, group]) => (
                <div key={role} className="border-b border-gray-800/50 last:border-0">
                  <div className="px-4 py-2 bg-gray-800/30 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">{roleIcon(role)} {role.toUpperCase()}</span>
                    <span className={`text-xs font-bold ${group.clockedIn.length >= group.min ? "text-green-400" : "text-red-400"}`}>
                      {group.clockedIn.length}/{group.target}
                    </span>
                  </div>
                  {group.employees.map(emp => {
                    const entry = clockEntries[emp.id];
                    const isClockedIn = entry?.clockedIn;
                    return (
                      <div key={emp.id} className="px-4 py-2 flex items-center justify-between hover:bg-gray-800/20">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleClock(emp)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition ${
                              isClockedIn ? "bg-green-500 border-green-500 text-white" : "border-gray-600 hover:border-gray-400"
                            }`}>
                            {isClockedIn ? "✓" : ""}
                          </button>
                          <div>
                            <div className={`text-sm ${isClockedIn ? "text-white" : "text-gray-500"}`}>{emp.name}</div>
                            {isClockedIn && entry?.clockInTime && (
                              <div className="text-xs text-gray-600">In: {new Date(entry.clockInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                            )}
                          </div>
                        </div>
                        {isClockedIn && (
                          <select value={entry?.station || role}
                            onChange={(e) => updateStation(emp.id, e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-300">
                            <option value="cook">🍳 Kitchen</option>
                            <option value="server">🍽️ Floor</option>
                            <option value="host">📋 Host</option>
                            <option value="dishwasher">🧹 Dish</option>
                            <option value="prep">🔪 Prep</option>
                            <option value="cashier">💰 Register</option>
                            <option value="drive-thru">🚗 Drive-Thru</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* MIDDLE: Orders */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <h2 className="font-bold text-sm">📋 Active Orders</h2>
                <span className="text-xs text-gray-500">Auto-refresh 30s</span>
              </div>

              {activeOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No active orders 🎉</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {activeOrders.map(order => {
                    const nextStatus = order.status === "new" ? "preparing" : order.status === "preparing" ? "ready" : "completed";
                    const nextLabel = order.status === "new" ? "👨‍🍳 Prep" : order.status === "preparing" ? "✅ Ready" : "✓ Done";
                    const statusColor = order.status === "new" ? "text-orange-400" : order.status === "preparing" ? "text-blue-400" : "text-green-400";

                    return (
                      <div key={order.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">#{order.order_number}</span>
                            <span>{channelIcon(order.channel)}</span>
                            <span className="text-sm text-gray-300">{order.customer_name}</span>
                          </div>
                          <span className={`text-xs font-bold ${statusColor}`}>
                            {order.status === "new" ? "🔔 NEW" : order.status === "preparing" ? "👨‍🍳 PREP" : "✅ READY"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {order.items?.map((i: { name?: string; quantity?: number; qty?: number }) =>
                            `${i.quantity || i.qty || 1}x ${i.name || "Item"}`
                          ).join(", ")}
                          <span className="text-green-400 ml-2">${order.total?.toFixed(2) || "0"}</span>
                          <span className="text-gray-600 ml-2">{timeAgo(order.created_at)}</span>
                        </div>
                        <button onClick={() => updateOrderStatus(order.id, nextStatus)}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition">
                          {nextLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Temps + Checklists */}
          <div className="lg:col-span-1 space-y-4">
            {/* Temp compliance */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="font-bold text-sm">🌡️ Temp Compliance Today</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {equipmentList.map(eq => {
                  const log = todayTemps.filter(t => t.equipment === eq).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
                  const isViolation = log?.status === "violation";
                  return (
                    <div key={eq} className={`px-4 py-2.5 flex items-center justify-between ${isViolation ? "bg-red-500/5" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${log ? (isViolation ? "bg-red-500" : "bg-green-500") : "bg-gray-600"}`} />
                        <span className="text-sm">{eq}</span>
                      </div>
                      {log ? (
                        <div className="text-right">
                          <span className={`text-sm font-bold ${isViolation ? "text-red-400" : "text-green-400"}`}>{log.temperature}°F</span>
                          <div className="text-xs text-gray-600">{log.recorder_name} · {new Date(log.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-yellow-400">⏳ Not logged</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active checklists */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="font-bold text-sm">✅ Shift Checklists</h2>
              </div>
              {checklists.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No active checklists
                  <a href="/staff" className="block mt-2 text-blue-400 text-xs">Start one in Staff Portal →</a>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {checklists.map(cl => (
                    <a key={cl.id} href={`/staff/checklist/${cl.id}`} className="block px-4 py-3 hover:bg-gray-800/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{cl.checklist_templates?.name || "Checklist"}</div>
                          <div className="text-xs text-gray-500">by {cl.completed_by}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${cl.completion_pct === 100 ? "text-green-400" : "text-blue-400"}`}>{cl.completion_pct}%</div>
                          <div className="w-16 bg-gray-800 rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${cl.completion_pct === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${cl.completion_pct}%` }} />
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Recent violations */}
            {violations.length > 0 && (
              <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-4">
                <h2 className="font-bold text-sm text-red-400 mb-2">🚨 Violations Today</h2>
                {violations.map(v => (
                  <div key={v.id} className="text-sm mb-1">
                    <span className="text-red-400 font-medium">{v.equipment}</span>
                    <span className="text-gray-400"> — {v.temperature}°F by {v.recorder_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
