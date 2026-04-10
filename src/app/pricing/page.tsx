"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    price: 199,
    key: "starter",
    locations: "1-3 locations",
    desc: "Food Safety + Hiring Autopilot",
    features: [
      "Food Safety Autopilot",
      "Hiring Autopilot",
      "SMS + Email Alerts",
      "Regional Dashboard",
      "Text-to-Apply",
      "Basic Reporting",
    ],
    color: "blue",
  },
  {
    name: "Growth",
    price: 399,
    key: "growth",
    locations: "4-10 locations",
    desc: "All Starter + Staffing + Spend Optimization",
    features: [
      "Everything in Starter",
      "Staffing Optimizer",
      "Spend Optimizer",
      "Busy Day Predictions",
      "Cost Risk Alerts",
      "Priority Support",
    ],
    color: "blue",
  },
  {
    name: "Enterprise",
    price: 799,
    key: "enterprise",
    popular: true,
    locations: "11-50 locations",
    desc: "All 14 Agents + Cross-Product AI",
    features: [
      "Everything in Growth",
      "Revenue Optimizer",
      "Cross-Product Intelligence",
      "Weather-Based Promos",
      "High-Risk Store Detection",
      "Weekly AI Insights",
      "PDF Reports",
      "Custom Integrations",
    ],
    color: "blue",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
        <div className="flex items-center gap-4">
          <a
            href="mailto:vertexlabsolutions@gmail.com?subject=Vertex%20Autopilot%20Demo%20Request"
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Book a Demo
          </a>
          <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-400 text-lg">Per location, per month. No hidden fees. Start with a free 30-day pilot.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`bg-gray-900 border rounded-2xl p-8 relative ${
                plan.popular ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-xs mb-1">{plan.locations}</p>
                <p className="text-gray-400 text-sm mb-4">{plan.desc}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">/mo</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">&#10003;</span> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.key)}
                disabled={loading === plan.key}
                className={`w-full py-3 rounded-lg font-medium transition ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "bg-gray-800 hover:bg-gray-700 border border-gray-700"
                } disabled:opacity-50`}
              >
                {loading === plan.key ? "Loading..." : "Get Started"}
              </button>
            </div>
          ))}
        </div>

        {/* Custom / 50+ locations */}
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">50+ Locations? Let&apos;s Talk.</h3>
          <p className="text-gray-400 mb-2 max-w-xl mx-auto">
            Custom pricing, dedicated account management, bespoke integrations,
            and a rollout plan built around your operations.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Perfect for franchise operators, area managers, and regional directors.
          </p>
          <a
            href="mailto:vertexlabsolutions@gmail.com?subject=Vertex%20Autopilot%20Enterprise%20Inquiry"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
          >
            Contact Sales
          </a>
        </div>

        {/* Pilot CTA */}
        <div className="mt-12 border-2 border-dashed border-green-600/50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-green-400 mb-2">Start With a Free 30-Day Pilot</h3>
          <p className="text-gray-400 mb-4">2-3 stores, all agents included, full setup by our team. Zero risk.</p>
          <a
            href="mailto:vertexlabsolutions@gmail.com?subject=Vertex%20Autopilot%20Free%20Pilot%20Request"
            className="inline-block px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition"
          >
            Request Free Pilot
          </a>
        </div>

        {/* ROI section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-6">Enterprise ROI at Scale</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
          <p className="text-xs text-gray-500 mt-4">
            Based on reduced labor costs, faster hiring, fewer compliance violations, and inventory waste reduction.
          </p>
        </div>
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
