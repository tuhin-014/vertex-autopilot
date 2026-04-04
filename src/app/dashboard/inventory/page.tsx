import { createServiceClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
import Link from "next/link";

const parStatusColors: Record<string, string> = {
  ok: "bg-green-500/20 text-green-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  low: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

const storageIcons: Record<string, string> = {
  "walk-in": "🧊",
  freezer: "❄️",
  "dry storage": "📦",
  line: "🍳",
};

export default async function InventoryPage() {
  const supabase = createServiceClient();

  const { data: items } = await supabase
    .from("inventory_items")
    .select("*, vendors:preferred_vendor_id(name)")
    .order("category")
    .order("name");

  const all = (items || []).map((item) => {
    const stock = Number(item.current_stock);
    const par = Number(item.par_level || 0);
    let parStatus = "ok";
    if (par > 0) {
      const pct = (stock / par) * 100;
      if (pct <= 25) parStatus = "critical";
      else if (pct <= 50) parStatus = "low";
      else if (pct <= 75) parStatus = "warning";
    }
    return { ...item, par_status: parStatus, pct_of_par: par > 0 ? Math.round((stock / par) * 100) : null };
  });

  const critical = all.filter((i) => i.par_status === "critical");
  const low = all.filter((i) => i.par_status === "low");
  const categories = [...new Set(all.map((i) => i.category).filter(Boolean))];
  const totalValue = all.reduce((s, i) => s + Number(i.current_stock) * Number(i.unit_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📦 Inventory Manager</h1>
          <p className="text-gray-400">{all.length} items tracked · ${totalValue.toLocaleString()} estimated value</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/inventory/alerts" className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm font-medium hover:bg-red-600/30 transition">
            🚨 Alerts ({critical.length + low.length})
          </Link>
          <Link href="/dashboard/inventory/count" className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition">
            📋 Count Sheet
          </Link>
          <Link href="/dashboard/inventory/waste" className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 rounded-lg text-sm font-medium hover:bg-yellow-600/30 transition">
            🗑️ Waste Log
          </Link>
          <Link href="/dashboard/inventory/orders" className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition">
            📋 POs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{all.length}</div>
          <div className="text-sm text-gray-400 mt-1">Total Items</div>
        </div>
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{critical.length}</div>
          <div className="text-sm text-gray-400 mt-1">Critical Low</div>
        </div>
        <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{low.length}</div>
          <div className="text-sm text-gray-400 mt-1">Below Par</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">${totalValue.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Inventory Value</div>
        </div>
      </div>

      {/* Items by category */}
      {categories.map((cat) => {
        const catItems = all.filter((i) => i.category === cat);
        return (
          <div key={cat} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold capitalize">{cat} ({catItems.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Storage</th>
                  <th className="px-4 py-2 text-right">Stock</th>
                  <th className="px-4 py-2 text-right">Par</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Vendor</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-gray-400">
                      {storageIcons[item.storage_location] || "📍"} {item.storage_location || "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {Number(item.current_stock).toFixed(0)} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">
                      {item.par_level || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${parStatusColors[item.par_status]}`}>
                        {item.pct_of_par !== null ? `${item.pct_of_par}%` : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {(item.vendors as { name: string } | null)?.name || "—"}
                    </td>
                    <td className="px-4 py-2 text-right">${Number(item.unit_cost || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {all.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No inventory items yet. Run the seed endpoint to populate.
        </div>
      )}
    </div>
  );
}
