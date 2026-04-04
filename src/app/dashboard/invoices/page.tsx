import { createServiceClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default async function InvoicesPage() {
  const supabase = createServiceClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, vendors(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  // Stats
  const all = invoices || [];
  const pending = all.filter((i) => i.status === "pending");
  const totalOutstanding = all
    .filter((i) => i.status === "pending" || i.status === "approved")
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const totalPaid = all
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const overdue = all.filter(
    (i) => i.due_date && new Date(i.due_date) < new Date() && i.status !== "paid"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Invoice Manager</h1>
          <p className="text-gray-400">Track, approve, and manage vendor invoices</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/invoices/price-alerts"
            className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 rounded-lg text-sm font-medium hover:bg-yellow-600/30 transition"
          >
            📈 Price Alerts
          </Link>
          <Link
            href="/dashboard/invoices/upload"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
          >
            + Upload Invoice
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{pending.length}</div>
          <div className="text-sm text-gray-400 mt-1">Pending Approval</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{overdue.length}</div>
          <div className="text-sm text-gray-400 mt-1">Overdue</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">${totalOutstanding.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Outstanding</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">${totalPaid.toLocaleString()}</div>
          <div className="text-sm text-gray-400 mt-1">Paid This Period</div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {all.map((inv) => {
                const isOverdue =
                  inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== "paid";
                return (
                  <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-mono text-sm">{inv.invoice_number || "—"}</td>
                    <td className="px-4 py-3">
                      {(inv.vendors as { name: string } | null)?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{inv.invoice_date || "—"}</td>
                    <td className={`px-4 py-3 ${isOverdue ? "text-red-400 font-medium" : "text-gray-400"}`}>
                      {inv.due_date || "—"}
                      {isOverdue && " ⚠️"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${Number(inv.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[inv.status] || "text-gray-400"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {all.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No invoices yet. Upload your first invoice to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
