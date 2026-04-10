"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Command", icon: "🎯", exact: true },
  { href: "/dashboard/stores", label: "Stores", icon: "📍" },
  { href: "/dashboard/orders", label: "Orders", icon: "📞" },
  { href: "/dashboard/checklists", label: "Checklists", icon: "✅" },
  { href: "/dashboard/safety", label: "Safety", icon: "🛡️" },
  { href: "/dashboard/hiring", label: "Hiring", icon: "👥" },
  { href: "/dashboard/employees", label: "Employees", icon: "👤" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
  { href: "/dashboard/waste", label: "Waste", icon: "🗑️" },
  { href: "/dashboard/events", label: "Events", icon: "📋" },
  { href: "/dashboard/approvals", label: "Approvals", icon: "🔔" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold text-sm">Vertex Autopilot</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-400 hover:text-white p-1"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800 px-4 pb-3">
          <nav className="space-y-1">
            {nav.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
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
    </>
  );
}
