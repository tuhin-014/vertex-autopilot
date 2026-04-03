"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    price: 79,
    key: "starter",
    agents: 2,
    desc: "Food Safety + Hiring Autopilot",
    features: [
      "🛡️ Food Safety Autopilot",
      "👥 Hiring Autopilot",
      "SMS + Email Alerts",
      "Regional Dashboard",
      "6 Cron Jobs",
      "Text-to-Apply",
    ],
    color: "blue",
  },
  {
    name: "Pro",
    price: 149,
    key: "pro",
    popular: true,
    agents: 4,
    desc: "All Starter + Staffing + Spend",
    features: [
      "Everything in Starter",
      "📅 Staffing Agent",
      "💰 Spend Optimizer",
      "Busy Day Predictions",
      "Cost Risk Alerts",
      "Priority Support",
    ],
    color: "purple",
  },
  {
    name: "Enterprise",
    price: 249,
    key: "enterprise",
    agents: 6,
    desc: "All 14 Agents + Cross-Product AI",
    features: [
      "Everything in Pro",
      "📊 Revenue Optimizer",
      "🧠 Cross-Product Intelligence",
      "Weather-Based Promos",
      "High-Risk Store Detection",
      "Weekly AI Insights",
      "PDF Reports",
      "Custom Integrations",
    ],
    color: "orange",
  },
];

export default function PricingPage() {
  const [stores, setStores] = useState(1);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, stores }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-xl">Vertex Autopilot</span>
        </Link>
        <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">Sign In</Link>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Pricing — Per Store, Per Month</h1>
          <p className="text-gray-400 text-lg">Start free with a 30-day pilot. Scale to hundreds of locations.</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <label className="text-gray-400">Number of stores:</label>
            <input
              type="number"
              min={1}
              max={500}
              value={stores}
              onChange={(e) => setStores(Math.max(1, Number(e.target.value)))}
              className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center text-white"
            />
            {stores >= 10 && <span className="text-green-400 text-sm">Volume discount available — contact us</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`bg-gray-900 border rounded-2xl p-8 relative ${
                plan.popular ? "border-purple-500 ring-2 ring-purple-500/20" : "border-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.desc}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">/store/mo</span>
                </div>
                {stores > 1 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {stores} stores = <span className="text-white font-bold">${(plan.price * stores).toLocaleString()}/mo</span>
                  </p>
                )}
                <p className="text-xs text-blue-400 mt-1">{plan.agents} AI Agents</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.key)}
                disabled={loading === plan.key}
                className={`w-full py-3 rounded-lg font-medium transition ${
                  plan.popular
                    ? "bg-purple-600 hover:bg-purple-500"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                } disabled:opacity-50`}
              >
                {loading === plan.key ? "Loading..." : "Get Started"}
              </button>
            </div>
          ))}
        </div>

        {/* Pilot CTA */}
        <div className="mt-16 border-2 border-dashed border-green-600/50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-green-400 mb-2">🎯 Start With a Free 30-Day Pilot</h3>
          <p className="text-gray-400 mb-4">2-3 stores, all agents included, full setup by our team. Zero risk.</p>
          <Link href="/login" className="inline-block px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition">
            Start Free Pilot
          </Link>
        </div>
      </main>
    </div>
  );
}
