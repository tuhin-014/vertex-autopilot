"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LineItem {
  description: string;
  quantity: number;
  price: number;
}

const TAX_RATE = 0.08875;

export default function NewOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, price: 0 },
  ]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [channel, setChannel] = useState("walk-in");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addLine = () =>
    setItems((prev) => [...prev, { description: "", quantity: 1, price: 0 }]);
  const removeLine = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const validItems = items.filter((it) => it.description.trim() && it.price > 0);
  const subtotal = validItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const submit = async () => {
    if (validItems.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          customer_name: customerName || "Walk-in",
          customer_phone: customerPhone,
          items: validItems.map((it) => ({
            name: it.description,
            quantity: it.quantity,
            price: it.price,
          })),
          subtotal: Math.round(subtotal * 100) / 100,
          tax,
          total,
          special_instructions: specialInstructions,
          taken_by: "Dashboard",
        }),
      });
      if (res.ok) router.push("/dashboard/orders");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Order</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manually enter an order. No POS sync — just type the items.
        </p>
      </div>

      {/* Customer + channel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Customer name</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in"
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Phone (optional)</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="walk-in">Walk-in</option>
            <option value="phone">Phone</option>
            <option value="online">Online</option>
            <option value="dine-in">Dine-in</option>
            <option value="catering">Catering</option>
          </select>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Items</h2>
          <button
            onClick={addLine}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            + Add line
          </button>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                value={it.description}
                onChange={(e) => updateLine(i, { description: e.target.value })}
                placeholder="Item description"
                className="col-span-6 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                min={1}
                value={it.quantity}
                onChange={(e) => updateLine(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="col-span-2 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={it.price}
                onChange={(e) => updateLine(i, { price: parseFloat(e.target.value) || 0 })}
                placeholder="Price"
                className="col-span-3 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => removeLine(i)}
                disabled={items.length === 1}
                className="col-span-1 text-gray-500 hover:text-red-400 disabled:opacity-30"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes + totals */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Special instructions (optional)</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={2}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="space-y-1 text-sm pt-2 border-t border-gray-800">
          <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-400"><span>Tax ({(TAX_RATE * 100).toFixed(2)}%)</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-white font-semibold text-lg pt-1"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={validItems.length === 0 || submitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-3 rounded-xl transition"
        >
          {submitting ? "Creating..." : `Create order — $${total.toFixed(2)}`}
        </button>
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="px-5 py-3 rounded-xl border border-gray-800 text-gray-300 hover:bg-gray-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
