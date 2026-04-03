import { createServerComponentClient } from "@/lib/supabase/server";

const categoryColors: Record<string, string> = {
  food: "bg-green-500/20 text-green-400",
  beverage: "bg-blue-500/20 text-blue-400",
  supplies: "bg-yellow-500/20 text-yellow-400",
  equipment: "bg-purple-500/20 text-purple-400",
  cleaning: "bg-cyan-500/20 text-cyan-400",
};

export default async function VendorsPage() {
  const supabase = await createServerComponentClient();

  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .order("name");

  // Enrich with spend data
  const enriched = await Promise.all(
    (vendors || []).map(async (vendor) => {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total, status")
        .eq("vendor_id", vendor.id);

      const totalSpend = (invoices || [])
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + Number(i.total || 0), 0);
      const pendingAmount = (invoices || [])
        .filter((i) => i.status === "pending" || i.status === "approved")
        .reduce((s, i) => s + Number(i.total || 0), 0);

      return { ...vendor, total_spend: totalSpend, pending_amount: pendingAmount, invoice_count: invoices?.length || 0 };
    })
  );

  const totalSpend = enriched.reduce((s, v) => s + v.total_spend, 0);
  const totalPending = enriched.reduce((s, v) => s + v.pending_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏢 Vendor Directory</h1>
          <p className="text-gray-400">{enriched.length} vendors · ${totalSpend.toLocaleString()} total spend</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{enriched.length}</div>
          <div className="text-sm text-gray-400 mt-1">Active Vendors</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">${totalSpend.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Total Paid</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">${totalPending.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Outstanding</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enriched.map((vendor) => (
          <div key={vendor.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{vendor.name}</h3>
                <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${categoryColors[vendor.category] || "bg-gray-700 text-gray-300"}`}>
                  {vendor.category || "general"}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{vendor.invoice_count} invoices</div>
                <div className="text-xs text-gray-500">{vendor.payment_terms || "—"}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Total Spend</span>
                <div className="font-medium text-green-400">${vendor.total_spend.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-500">Pending</span>
                <div className="font-medium text-yellow-400">${vendor.pending_amount.toLocaleString()}</div>
              </div>
            </div>
            {vendor.contact_name && (
              <div className="mt-3 pt-3 border-t border-gray-800 text-sm text-gray-400">
                👤 {vendor.contact_name}
                {vendor.contact_email && <span className="ml-2">· {vendor.contact_email}</span>}
              </div>
            )}
          </div>
        ))}
        {enriched.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No vendors yet. Add vendors through the seed endpoint or API.
          </div>
        )}
      </div>
    </div>
  );
}
