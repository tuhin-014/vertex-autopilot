import { createServerComponentClient } from "@/lib/supabase/server";
import Link from "next/link";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  received: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default async function PurchaseOrdersPage() {
  const supabase = await createServerComponentClient();

  const { data: orders } = await supabase
    .from("purchase_orders")
    .select("*, vendors(name)")
    .order("created_at", { ascending: false });

  const all = orders || [];
  const drafts = all.filter((o) => o.status === "draft");
  const submitted = all.filter((o) => o.status === "submitted");
  const totalValue = all.reduce((s, o) => s + Number(o.total_estimated || 0), 0);

  // Get item counts
  const enriched = await Promise.all(
    all.map(async (po) => {
      const { data: items } = await supabase
        .from("purchase_order_items")
        .select("id")
        .eq("po_id", po.id);
      return { ...po, item_count: items?.length || 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Purchase Orders</h1>
          <p className="text-gray-400">Manage vendor orders and restocking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{all.length}</div>
          <div className="text-sm text-gray-400 mt-1">Total POs</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{drafts.length}</div>
          <div className="text-sm text-gray-400 mt-1">Drafts</div>
        </div>
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{submitted.length}</div>
          <div className="text-sm text-gray-400 mt-1">Submitted</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">${totalValue.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Total Value</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-4 py-3">PO #</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Estimated Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((po) => (
              <tr key={po.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 font-mono text-xs">{po.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-medium">
                  {(po.vendors as { name: string } | null)?.name || "Unknown"}
                </td>
                <td className="px-4 py-3">{po.item_count} items</td>
                <td className="px-4 py-3 text-right font-medium">
                  ${Number(po.total_estimated || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[po.status] || "text-gray-400"}`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(po.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                  {po.notes || "—"}
                </td>
              </tr>
            ))}
            {all.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No purchase orders yet. The inventory agent will auto-generate POs for below-par items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
