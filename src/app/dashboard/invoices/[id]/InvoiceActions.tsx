"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvoiceActions({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  const updateStatus = async (status: string) => {
    setLoading(status);
    try {
      await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch (err) {
      console.error("Update failed:", err);
    }
    setLoading("");
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="font-semibold mb-4">Actions</h2>
      <div className="flex gap-3 flex-wrap">
        {currentStatus === "pending" && (
          <>
            <button
              onClick={() => updateStatus("approved")}
              disabled={!!loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
            >
              {loading === "approved" ? "..." : "✅ Approve"}
            </button>
            <button
              onClick={() => updateStatus("disputed")}
              disabled={!!loading}
              className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition"
            >
              {loading === "disputed" ? "..." : "⚠️ Dispute"}
            </button>
          </>
        )}
        {currentStatus === "approved" && (
          <button
            onClick={() => updateStatus("paid")}
            disabled={!!loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
          >
            {loading === "paid" ? "..." : "💰 Mark as Paid"}
          </button>
        )}
        {currentStatus === "disputed" && (
          <button
            onClick={() => updateStatus("pending")}
            disabled={!!loading}
            className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-600/30 disabled:opacity-50 rounded-lg text-sm font-medium transition"
          >
            {loading === "pending" ? "..." : "↩️ Re-open"}
          </button>
        )}
        {currentStatus === "paid" && (
          <span className="px-4 py-2 text-green-400 text-sm">✅ This invoice has been paid</span>
        )}
      </div>
    </div>
  );
}
