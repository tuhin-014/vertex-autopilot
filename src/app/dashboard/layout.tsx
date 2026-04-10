"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { roleNavItems } from "@/lib/mock-data";

type RoleKey = "area_manager" | "store_manager" | "employee";

const roleLabels: Record<RoleKey, string> = {
  area_manager: "Area Manager",
  store_manager: "Store Manager",
  employee: "Employee",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<RoleKey>("area_manager");
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = roleNavItems[role];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-white">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold text-sm">Vertex Autopilot</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-400 hover:text-white p-1">
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 pb-3">
          {/* Role switcher */}
          <div className="mb-3 flex gap-1">
            {(Object.keys(roleLabels) as RoleKey[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  role === r ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {roleLabels[r]}
              </button>
            ))}
          </div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    isActive ? "bg-blue-600/20 text-blue-400 font-medium" : "text-gray-300"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 p-4 flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="font-bold">Vertex Autopilot</div>
            <div className="text-xs text-gray-500">Enterprise Dashboard</div>
          </div>
        </div>

        {/* Role switcher */}
        <div className="mb-4 p-1 bg-gray-800 rounded-lg flex gap-0.5">
          {(Object.keys(roleLabels) as RoleKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 px-1.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                role === r
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>

        <nav className="flex-1 space-y-0.5">
          {nav.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && !item.exact;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30 font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="text-xs text-gray-600 pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400">14 agents active</span>
          </div>
          <div className="text-gray-500 mb-1">73 locations monitored</div>
          VertexLab Solutions LLC &copy; 2026
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen">{children}</main>
    </div>
  );
}
