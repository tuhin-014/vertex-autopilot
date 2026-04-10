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
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition">
            Pricing
          </Link>
          <a
            href="mailto:vertexlabsolutions@gmail.com?subject=Vertex%20Autopilot%20Demo%20Request"
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Book a Demo
          </a>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-8 pt-20 pb-16 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/30 rounded-full px-4 py-1.5 text-blue-400 text-sm">
              AI-Powered Restaurant Operations
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              One Brain That Runs Your{" "}
              <span className="text-blue-400">Restaurant Operations</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              14 AI agents monitor food safety, hiring, staffing, inventory, spending, and revenue
              across every location — 24/7. Autonomous action. Human oversight. Zero gaps.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <a
                href="mailto:vertexlabsolutions@gmail.com?subject=Vertex%20Autopilot%20Demo%20Request"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-lg transition"
              >
                Book a Demo
              </a>
              <Link
                href="/pricing"
                className="px-8 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-medium text-lg transition text-gray-300"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="border-y border-gray-800 bg-gray-900/50 py-8 px-8">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-4 font-medium">
              Trusted by multi-location restaurant operators
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏪</span>
                <span className="text-sm font-medium">Franchise Groups</span>
              </div>
              <div className="w-px h-6 bg-gray-700 hidden md:block" />
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <span className="text-sm font-medium">Area Managers</span>
              </div>
              <div className="w-px h-6 bg-gray-700 hidden md:block" />
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                <span className="text-sm font-medium">Restaurant Groups</span>
              </div>
              <div className="w-px h-6 bg-gray-700 hidden md:block" />
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                <span className="text-sm font-medium">Multi-Unit Operators</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { val: "14", label: "AI Agents" },
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
        </section>

        {/* Agent Cards */}
        <section id="features" className="py-16 px-8 bg-gray-900/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">AI Agents That Work For You</h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Each agent autonomously handles a critical function across all your locations.
              They coordinate with each other and escalate to you only when needed.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Food Safety Autopilot", desc: "Missed temp log? SMS the cook. Cert expiring? Auto-enroll in training. Violation pattern? Risk alert to regional manager." },
                { title: "Hiring Autopilot", desc: "Store understaffed? Auto-post jobs. Screen candidates with AI. Schedule interviews. Send offers. Start onboarding." },
                { title: "Staffing Optimizer", desc: "Predict busy days from weather and events. Auto-adjust schedules. Alert when coverage drops below target." },
                { title: "Spend Optimizer", desc: "Catch invoice overcharges, vendor price drift, and unnecessary purchases before they hit your P&L." },
                { title: "Revenue Optimizer", desc: "Dynamic promotions based on weather, inventory levels, and local events. Maximize every revenue opportunity." },
                { title: "Cross-Product Intelligence", desc: "Low reviews + staffing issues? Connected. High call volume? Hire kitchen staff. Insights no single system sees." },
              ].map((agent) => (
                <div
                  key={agent.title}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left hover:border-blue-600/50 transition"
                >
                  <h3 className="font-bold text-lg mb-2">{agent.title}</h3>
                  <p className="text-gray-400 text-sm">{agent.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Built for Multi-Location Operators</h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Whether you manage 3 stores or 300, Vertex Autopilot scales with you.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Franchise Operators",
                  desc: "Standardize operations across dozens of locations. One dashboard, consistent compliance, zero blind spots.",
                },
                {
                  title: "Area Managers",
                  desc: "Stop spending weekends on spreadsheets. Get real-time visibility into every store's health, hiring, and safety status.",
                },
                {
                  title: "Restaurant Groups",
                  desc: "Multi-concept? Multi-brand? Vertex adapts to each location's needs while giving you unified oversight.",
                },
                {
                  title: "Regional Directors",
                  desc: "Make data-driven decisions with AI-generated insights. Know which stores need attention before problems escalate.",
                },
              ].map((uc) => (
                <div
                  key={uc.title}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/50 transition"
                >
                  <h3 className="font-bold text-lg mb-2">{uc.title}</h3>
                  <p className="text-gray-400 text-sm">{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <section className="py-16 px-8 bg-gray-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">The ROI Is Clear</h2>
            <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
              Vertex Autopilot replaces manual oversight, reduces compliance violations,
              accelerates hiring, and catches costly errors before they happen.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">$2,400</div>
                <div className="text-sm text-gray-400">Average monthly savings per location</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">73 locations</div>
                <div className="text-sm text-gray-400">= $175,200/month in savings</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">$2.1M+</div>
                <div className="text-sm text-gray-400">Annual ROI for enterprise operators</div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Based on reduced labor costs, faster hiring, fewer compliance violations, and inventory waste reduction.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400 text-center mb-12">Per location, per month. No hidden fees. Cancel anytime.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Starter */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-1">Starter</h3>
                <p className="text-gray-500 text-xs mb-4">1-3 locations</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Food Safety Autopilot</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Hiring Autopilot</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> SMS + Email Alerts</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Regional Dashboard</li>
                </ul>
                <Link href="/pricing" className="block w-full py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium text-sm text-center transition">
                  Get Started
                </Link>
              </div>

              {/* Growth */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-1">Growth</h3>
                <p className="text-gray-500 text-xs mb-4">4-10 locations</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">$399</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Everything in Starter</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Staffing Optimizer</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Spend Optimizer</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Busy Day Predictions</li>
                </ul>
                <Link href="/pricing" className="block w-full py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium text-sm text-center transition">
                  Get Started
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-gray-900 border border-blue-600 rounded-xl p-6 ring-2 ring-blue-600/20 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
                <h3 className="font-bold text-lg mb-1">Enterprise</h3>
                <p className="text-gray-500 text-xs mb-4">11-50 locations</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">$799</span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Everything in Growth</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> All 14 AI Agents</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Cross-Product Intelligence</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Priority Support</li>
                </ul>
                <Link href="/pricing" className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm text-center transition">
                  Get Started
                </Link>
              </div>

              {/* Custom */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-1">Custom</h3>
                <p className="text-gray-500 text-xs mb-4">50+ locations</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Everything in Enterprise</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Dedicated Account Manager</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Custom Integrations</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Volume Pricing</li>
                </ul>
                <a
                  href="mailto:vertexlabsolutions@gmail.com?subject=Vertex%20Autopilot%20Enterprise%20Inquiry"
                  className="block w-full py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium text-sm text-center transition"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Book a Demo CTA */}
        <section className="py-16 px-8 bg-blue-600/5 border-y border-blue-600/20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Operations?</h2>
            <p className="text-gray-400 mb-8 text-lg">
              See how Vertex Autopilot can save your organization millions annually.
              Schedule a personalized demo with our team.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="mailto:vertexlabsolutions@gmail.com?subject=Vertex%20Autopilot%20Demo%20Request"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-lg transition"
              >
                Book a Demo
              </a>
              <Link
                href="/login"
                className="px-8 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-medium text-lg transition text-gray-300"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-8 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 text-sm">
            &copy; 2026 VertexLab Solutions LLC. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition">
              Terms
            </Link>
            <a
              href="mailto:vertexlabsolutions@gmail.com"
              className="text-gray-500 hover:text-gray-300 transition"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
