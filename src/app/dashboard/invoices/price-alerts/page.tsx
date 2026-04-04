import { createServiceClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function PriceAlertsPage() {
  const supabase = createServiceClient();

  const { data: alerts } = await supabase
    .from("invoice_items")
    .select("*, invoices!inner(id, invoice_number, invoice_date, vendor_id, vendors!inner(name))")
    .gt("price_change_pct", 5)
    .order("price_change_pct", { ascending: false })
    .limit(100);

  const all = alerts || [];
  const critical = all.filter((a) => Number(a.price_change_pct) > 20);
  const moderate = all.filter((a) => Number(a.price_change_pct) > 10 && Number(a.price_change_pct) <= 20);
  const minor = all.filter((a) => Number(a.price_change_pct) <= 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/invoices" className="text-gray-400 hover:text-white text-sm">← Invoices</Link>
          <h1 className="text-3xl font-bold mt-1">📈 Price Alerts</h1>
          <p className="text-gray-400">Items with &gt;5% price increase from last order</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{critical.length}</div>
          <div className="text-sm text-gray-400 mt-1">&gt;20% Increase</div>
        </div>
        <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{moderate.length}</div>
          <div className="text-sm text-gray-400 mt-1">10-20% Increase</div>
        </div>
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{minor.length}</div>
          <div className="text-sm text-gray-400 mt-1">5-10% Increase</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3 text-right">Previous</th>
              <th className="px-4 py-3 text-right">Current</th>
              <th className="px-4 py-3 text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {all.map((item) => {
              const inv = item.invoices as { id: string; invoice_number: string; invoice_date: string; vendors: { name: string } };
              const pct = Number(item.price_change_pct);
              return (
                <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-medium">{item.description}</td>
                  <td className="px-4 py-3 text-gray-400">{inv.vendors.name}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="text-blue-400 hover:text-blue-300">
                      #{inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">${Number(item.previous_price || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(item.unit_price || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${pct > 20 ? "text-red-400" : pct > 10 ? "text-yellow-400" : "text-orange-400"}`}>
                      +{pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {all.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  🎉 No price increases detected. All vendor pricing is stable.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
