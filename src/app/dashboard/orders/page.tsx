"use client";

import { useState } from "react";

const ORDERAI_URL = "https://orderai-web.vercel.app";
const EMBED_TOKEN = "orderai_embed_43e0b8c58114bd7604334116afe67658";

const quickLinks = [
  { label: "Orders", href: "/dashboard", icon: "📋" },
  { label: "Menu", href: "/dashboard/menu", icon: "🍽️" },
  { label: "Customers", href: "/dashboard/customers", icon: "👥" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "📊" },
  { label: "Calls", href: "/dashboard/calls", icon: "📞" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export default function AIOrdersPage() {
  const [activeView, setActiveView] = useState("/dashboard");

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Phone Orders</h1>
              <p className="text-sm text-gray-500">Powered by OrderAI — 24/7 automated phone ordering</p>
            </div>
          </div>
          <a
            href={ORDERAI_URL + activeView}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
          >
            Open Full Dashboard ↗
          </a>
        </div>

        {/* Quick nav */}
        <div className="flex gap-2 overflow-x-auto">
          {quickLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => setActiveView(link.href)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeView === link.href
                  ? "bg-orange-100 text-orange-700 border border-orange-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded OrderAI */}
      <iframe
        src={`${ORDERAI_URL}${activeView}?embed_token=${EMBED_TOKEN}`}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write"
        title="OrderAI Dashboard"
      />
    </div>
  );
}
