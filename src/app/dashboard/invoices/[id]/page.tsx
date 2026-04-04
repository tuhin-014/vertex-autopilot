import { createServiceClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
import Link from "next/link";
import InvoiceActions from "./InvoiceActions";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, vendors(id, name, contact_name, contact_email, category, payment_terms)")
    .eq("id", id)
    .single();

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Invoice not found</p>
        <Link href="/dashboard/invoices" className="text-blue-400 mt-4 inline-block">← Back to invoices</Link>
      </div>
    );
  }

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("id");

  const vendor = invoice.vendors as { id: string; name: string; contact_name: string; contact_email: string; category: string; payment_terms: string } | null;
  const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== "paid";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/invoices" className="text-gray-400 hover:text-white text-sm">← Invoices</Link>
          <h1 className="text-3xl font-bold mt-1">Invoice #{invoice.invoice_number || "N/A"}</h1>
          <p className="text-gray-400">{vendor?.name || "Unknown vendor"}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm border ${statusColors[invoice.status] || "text-gray-400"}`}>
          {invoice.status}
        </span>
      </div>

      {isOverdue && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          ⚠️ This invoice is overdue! Due date was {invoice.due_date}
        </div>
      )}

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="font-semibold text-lg">Invoice Details</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-400">Invoice Date:</span>
            <span>{invoice.invoice_date || "—"}</span>
            <span className="text-gray-400">Due Date:</span>
            <span className={isOverdue ? "text-red-400" : ""}>{invoice.due_date || "—"}</span>
            <span className="text-gray-400">Subtotal:</span>
            <span>${Number(invoice.subtotal || 0).toFixed(2)}</span>
            <span className="text-gray-400">Tax:</span>
            <span>${Number(invoice.tax || 0).toFixed(2)}</span>
            <span className="text-gray-400 font-medium">Total:</span>
            <span className="font-bold text-lg">${Number(invoice.total || 0).toFixed(2)}</span>
          </div>
          {invoice.notes && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <span className="text-gray-400 text-sm">Notes: </span>
              <span className="text-sm">{invoice.notes}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="font-semibold text-lg">Vendor Info</h2>
          {vendor ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-400">Name:</span>
              <Link href={`/dashboard/vendors`} className="text-blue-400 hover:text-blue-300">{vendor.name}</Link>
              <span className="text-gray-400">Contact:</span>
              <span>{vendor.contact_name || "—"}</span>
              <span className="text-gray-400">Email:</span>
              <span>{vendor.contact_email || "—"}</span>
              <span className="text-gray-400">Category:</span>
              <span className="capitalize">{vendor.category || "—"}</span>
              <span className="text-gray-400">Terms:</span>
              <span>{vendor.payment_terms || "—"}</span>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No vendor linked</p>
          )}
          {invoice.approved_at && (
            <div className="mt-3 pt-3 border-t border-gray-800 text-sm">
              <span className="text-green-400">✓ Approved</span>
              <span className="text-gray-500 ml-2">{new Date(invoice.approved_at).toLocaleDateString()}</span>
            </div>
          )}
          {invoice.paid_at && (
            <div className="text-sm">
              <span className="text-green-400">✓ Paid</span>
              <span className="text-gray-500 ml-2">{new Date(invoice.paid_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold">Line Items ({items?.length || 0})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-6 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Unit Price</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Price Δ</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((item) => (
              <tr key={item.id} className="border-b border-gray-800/50">
                <td className="px-6 py-3">{item.description}</td>
                <td className="px-4 py-3 capitalize text-gray-400">{item.category || "—"}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-400">{item.unit}</td>
                <td className="px-4 py-3 text-right">${Number(item.unit_price || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium">${Number(item.total_price || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  {item.price_change_pct ? (
                    <span className={Number(item.price_change_pct) > 5 ? "text-red-400" : Number(item.price_change_pct) > 0 ? "text-yellow-400" : "text-green-400"}>
                      {Number(item.price_change_pct) > 0 ? "+" : ""}{Number(item.price_change_pct).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No line items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <InvoiceActions invoiceId={invoice.id} currentStatus={invoice.status} />
    </div>
  );
}
