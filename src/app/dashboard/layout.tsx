import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Command Center", icon: "🎯" },
  { href: "/dashboard/safety", label: "Food Safety", icon: "🛡️" },
  { href: "/dashboard/hiring", label: "Hiring", icon: "👥" },
  { href: "/dashboard/events", label: "Agent Activity", icon: "📋" },
  { href: "/dashboard/approvals", label: "Approvals", icon: "✅" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🤖</span>
          <div>
            <div className="font-bold">Vertex Autopilot</div>
            <div className="text-xs text-gray-500">Regional Dashboard</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition text-sm"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-xs text-gray-600 pt-4 border-t border-gray-800">
          Vertex Lab Solutions © 2026
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
