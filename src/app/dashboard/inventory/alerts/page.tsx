import { createServiceClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
import Link from "next/link";

export default async function InventoryAlertsPage() {
  const supabase = createServiceClient();

  // Below-par items
  const { data: allItems } = await supabase
    .from("inventory_items")
    .select("*, vendors:preferred_vendor_id(name)")
    .not("par_level", "is", null);

  const belowPar = (allItems || [])
    .filter((item) => Number(item.current_stock) < Number(item.par_level))
    .map((item) => ({
      ...item,
      deficit: Number(item.par_level) - Number(item.current_stock),
      pct_of_par: Math.round((Number(item.current_stock) / Number(item.par_level)) * 100),
    }))
    .sort((a, b) => a.pct_of_par - b.pct_of_par);

  // Expiring items
  const expiringItems = (allItems || [])
    .filter((item) => item.shelf_life_days && item.last_counted_at && Number(item.current_stock) > 0)
    .map((item) => {
      const countedAt = new Date(item.last_counted_at).getTime();
      const shelfLifeMs = item.shelf_life_days * 24 * 60 * 60 * 1000;
      const expiresAt = countedAt + shelfLifeMs;
      const daysLeft = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
      return { ...item, days_until_expiry: daysLeft };
    })
    .filter((item) => item.days_until_expiry <= 7)
    .sort((a, b) => a.days_until_expiry - b.days_until_expiry);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/inventory" className="text-gray-400 hover:text-white text-sm">← Inventory</Link>
          <h1 className="text-3xl font-bold mt-1">🚨 Inventory Alerts</h1>
          <p className="text-gray-400">{belowPar.length + expiringItems.length} total alerts</p>
        </div>
        <Link
          href="/api/cron/check-inventory"
          target="_blank"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
        >
          ▶ Run Check Now
        </Link>
      </div>

      {/* Below Par */}
      <div className="bg-gray-900 border border-red-500/30 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <span className="text-red-400 text-lg">📦</span>
          <h2 className="font-semibold">Below Par Level ({belowPar.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right">Current</th>
              <th className="px-4 py-2 text-right">Par</th>
              <th className="px-4 py-2 text-right">Need</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Vendor</th>
            </tr>
          </thead>
          <tbody>
            {belowPar.map((item) => (
              <tr key={item.id} className="border-b border-gray-800/50">
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2 capitalize text-gray-400">{item.category}</td>
                <td className="px-4 py-2 text-right">{Number(item.current_stock).toFixed(0)} {item.unit}</td>
                <td className="px-4 py-2 text-right text-gray-400">{item.par_level}</td>
                <td className="px-4 py-2 text-right text-red-400 font-medium">+{item.deficit.toFixed(0)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.pct_of_par <= 25 ? "bg-red-500" : item.pct_of_par <= 50 ? "bg-orange-500" : "bg-yellow-500"}`}
                        style={{ width: `${Math.min(100, item.pct_of_par)}%` }}
                      />
                    </div>
                    <span className={`text-xs ${item.pct_of_par <= 25 ? "text-red-400" : item.pct_of_par <= 50 ? "text-orange-400" : "text-yellow-400"}`}>
                      {item.pct_of_par}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-400">
                  {(item.vendors as { name: string } | null)?.name || "—"}
                </td>
              </tr>
            ))}
            {belowPar.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  🎉 All items at or above par level!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Expiring Items */}
      <div className="bg-gray-900 border border-yellow-500/30 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <span className="text-yellow-400 text-lg">⏰</span>
          <h2 className="font-semibold">Expiring Soon ({expiringItems.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Storage</th>
              <th className="px-4 py-2 text-right">Stock</th>
              <th className="px-4 py-2">Expires In</th>
            </tr>
          </thead>
          <tbody>
            {expiringItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-800/50">
                <td className="px-4 py-2 font-medium">{item.name}</td>
                <td className="px-4 py-2 capitalize text-gray-400">{item.category}</td>
                <td className="px-4 py-2 text-gray-400">{item.storage_location || "—"}</td>
                <td className="px-4 py-2 text-right">{Number(item.current_stock).toFixed(0)} {item.unit}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.days_until_expiry <= 0 ? "bg-red-500/20 text-red-400" :
                    item.days_until_expiry <= 1 ? "bg-orange-500/20 text-orange-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {item.days_until_expiry <= 0 ? "EXPIRED" : `${item.days_until_expiry} day(s)`}
                  </span>
                </td>
              </tr>
            ))}
            {expiringItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No items expiring soon.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
