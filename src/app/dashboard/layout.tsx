"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./components/MobileNav";

const nav = [
  { href: "/dashboard", label: "Command Center", icon: "🎯", exact: true },
  { href: "/dashboard/stores", label: "All Stores", icon: "📍" },
  { href: "/dashboard/orders", label: "Orders", icon: "📞" },
  { href: "/dashboard/menu", label: "Menu", icon: "🍽️" },
  { href: "/dashboard/checklists", label: "Checklists", icon: "✅" },
  { href: "/dashboard/safety", label: "Food Safety", icon: "🛡️" },
  { href: "/dashboard/hiring", label: "Hiring", icon: "👥" },
  { href: "/dashboard/invoices", label: "Invoices", icon: "💰" },
  { href: "/dashboard/vendors", label: "Vendors", icon: "🏢" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
  { href: "/dashboard/waste", label: "Waste", icon: "🗑️" },
  { href: "/dashboard/financials", label: "Financials", icon: "💵" },
  { href: "/dashboard/events", label: "Agent Activity", icon: "📋" },
  { href: "/dashboard/approvals", label: "Approvals", icon: "🔔" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile nav */}
      <MobileNav />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 p-4 flex-col shrink-0">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="font-bold">Vertex Autopilot</div>
            <div className="text-xs text-gray-500">Regional Dashboard</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

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
            <span className="text-green-400">10 agents active</span>
          </div>
          Vertex Lab Solutions © 2026
        </div>
      </aside>

      {/* Main content — responsive padding */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-h-screen">{children}</main>
    </div>
  );
}
