import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-xl">Vertex Autopilot</span>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/30 rounded-full px-4 py-1.5 text-blue-400 text-sm">
            <span>🧠</span> AI-Powered Operations
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            One Brain That Runs Your{" "}
            <span className="text-blue-400">Restaurant Operations</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            6 AI agents monitor food safety, hiring, staffing, spending, and revenue across every
            location — 24/7. Autonomous action. Human oversight. Zero gaps.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-lg transition"
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className="px-8 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-medium text-lg transition text-gray-300"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Agent Cards */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24 px-4">
          {[
            { emoji: "🛡️", title: "Food Safety Autopilot", desc: "Missed temp log? SMS the cook. Cert expiring? Auto-enroll in training. Violation pattern? Risk alert to regional." },
            { emoji: "👥", title: "Hiring Autopilot", desc: "Store understaffed? Auto-post jobs. Screen candidates with AI. Schedule interviews. Send offers. Start onboarding." },
            { emoji: "🧠", title: "Cross-Product Intelligence", desc: "Low reviews + staffing issues? Connected. High call volume? Hire kitchen staff. The moat nobody else can build." },
          ].map((agent) => (
            <div
              key={agent.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left hover:border-blue-600/50 transition"
            >
              <div className="text-3xl mb-3">{agent.emoji}</div>
              <h3 className="font-bold text-lg mb-2">{agent.title}</h3>
              <p className="text-gray-400 text-sm">{agent.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20 mb-20">
          {[
            { val: "6", label: "AI Agents" },
            { val: "24/7", label: "Monitoring" },
            { val: "< 30s", label: "Alert Response" },
            { val: "93%", label: "Cost Savings vs. Competitors" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-blue-400">{s.val}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-8 py-6 text-center text-gray-500 text-sm">
        © 2026 Vertex Lab Solutions. All rights reserved.
      </footer>
    </div>
  );
}
