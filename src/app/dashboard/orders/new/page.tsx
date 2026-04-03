"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

interface CartItem {
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number;
  modifications: string[];
}

export default function NewOrderPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [channel, setChannel] = useState("walk-in");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/menu?available=true")
      .then((r) => r.json())
      .then((d) => { setMenu(d.items || []); setLoading(false); });
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) {
        return prev.map((c) => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menu_item_id: item.id, name: item.name, quantity: 1, price: item.price, modifications: [] }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.menu_item_id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = subtotal * 0.08875;
  const total = subtotal + tax;

  const submit = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          customer_name: customerName || "Walk-in",
          customer_phone: customerPhone,
          items: cart,
          subtotal,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          special_instructions: specialInstructions,
          taken_by: "Dashboard",
        }),
      });
      if (res.ok) router.push("/dashboard/orders");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [...new Set(menu.map((m) => m.category).filter(Boolean))];
  const filtered = menu.filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400 animate-pulse">Loading menu...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📝 New Order</h1>
        <p className="text-gray-400">Place a walk-in or phone order</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer + Channel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-medium">Customer Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in" className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-medium">Phone</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-medium">Channel</label>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="walk-in">🚶 Walk-in</option>
                  <option value="phone">📞 Phone</option>
                  <option value="online">🌐 Online</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search */}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu items..." className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" />

          {/* Menu by category */}
          {categories.map((cat) => {
            const items = filtered.filter((m) => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <h2 className="font-semibold capitalize">{cat}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-800">
                  {items.map((item) => (
                    <button key={item.id} onClick={() => addToCart(item)} className="bg-gray-900 p-3 text-left hover:bg-gray-800/50 transition flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-400">${item.price.toFixed(2)}</div>
                      </div>
                      <span className="text-blue-400 text-lg">+</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {menu.length === 0 && (
            <div className="text-center py-12 text-gray-500">No menu items. Run the seed endpoint to populate.</div>
          )}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-4">
            <h2 className="font-semibold mb-4">🛒 Cart ({cart.length} items)</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">Tap menu items to add</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.menu_item_id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-400">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQty(item.menu_item_id, -1)} className="w-6 h-6 rounded bg-gray-800 text-gray-400 hover:text-white text-xs flex items-center justify-center">−</button>
                      <span className="text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.menu_item_id, 1)} className="w-6 h-6 rounded bg-gray-800 text-gray-400 hover:text-white text-xs flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))}

                <div className="border-t border-gray-800 pt-3 mt-3">
                  <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Special instructions..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-500" rows={2} />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Tax (8.875%)</span><span>${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  </div>
                  <button onClick={submit} disabled={submitting || cart.length === 0} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition">
                    {submitting ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
