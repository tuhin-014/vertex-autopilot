"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Vendor {
  id: string;
  name: string;
}

interface InvoiceItem {
  description: string;
  category: string;
  quantity: number | string;
  unit: string;
  unit_price: number | string;
  total_price: number | string;
}

export default function UploadInvoicePage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [form, setForm] = useState({
    vendor_id: "",
    invoice_number: "",
    invoice_date: "",
    due_date: "",
    subtotal: "",
    tax: "",
    total: "",
    notes: "",
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", category: "other", quantity: "", unit: "each", unit_price: "", total_price: "" },
  ]);

  useEffect(() => {
    fetch("/api/vendors")
      .then((r) => r.json())
      .then((data) => setVendors(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleOCR = async () => {
    if (!imageUrl) return;
    setOcrLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, location_id: null }),
      });
      const data = await res.json();
      if (data.invoice) {
        router.push(`/dashboard/invoices/${data.invoice.id}`);
      }
    } catch (err) {
      console.error("OCR failed:", err);
    }
    setOcrLoading(false);
  };

  const addItem = () => {
    setItems([...items, { description: "", category: "other", quantity: "", unit: "each", unit_price: "", total_price: "" }]);
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const updated = [...items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;
    // Auto-calc total
    if (field === "quantity" || field === "unit_price") {
      const qty = parseFloat(updated[idx].quantity as string) || 0;
      const price = parseFloat(updated[idx].unit_price as string) || 0;
      updated[idx].total_price = (qty * price).toFixed(2);
    }
    setItems(updated);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subtotal: form.subtotal ? parseFloat(form.subtotal) : null,
          tax: form.tax ? parseFloat(form.tax) : null,
          total: form.total ? parseFloat(form.total) : null,
          image_url: imageUrl || null,
          items: items
            .filter((i) => i.description)
            .map((i) => ({
              ...i,
              quantity: i.quantity ? parseFloat(i.quantity as string) : null,
              unit_price: i.unit_price ? parseFloat(i.unit_price as string) : null,
              total_price: i.total_price ? parseFloat(i.total_price as string) : null,
            })),
        }),
      });
      const data = await res.json();
      if (data.invoice) {
        router.push(`/dashboard/invoices/${data.invoice.id}`);
      }
    } catch (err) {
      console.error("Submit failed:", err);
    }
    setLoading(false);
  };

  const categories = ["produce", "meat", "dairy", "beverages", "supplies", "cleaning", "paper_goods", "equipment", "other"];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">📤 Upload Invoice</h1>
        <p className="text-gray-400">Upload a photo/PDF for OCR or enter manually</p>
      </div>

      {/* OCR Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">📸 OCR Upload (Auto-Extract)</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Paste invoice image URL..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleOCR}
            disabled={!imageUrl || ocrLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
          >
            {ocrLoading ? "Processing..." : "🔍 Extract with AI"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Uses GPT-4o Vision to extract invoice data automatically</p>
      </div>

      {/* Manual Entry */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">✏️ Manual Entry</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Vendor</label>
            <select
              value={form.vendor_id}
              onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Invoice #</label>
            <input
              type="text"
              value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Invoice Date</label>
            <input
              type="date"
              value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Line Items</h3>
            <button onClick={addItem} className="text-sm text-blue-400 hover:text-blue-300">
              + Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Description</label>}
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Item name"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Category</label>}
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(idx, "category", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Qty</label>}
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-1">
                  {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Unit</label>}
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(idx, "unit", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {["case", "lb", "each", "gallon", "bag", "box"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Unit Price</label>}
                  <input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                    placeholder="$0.00"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-gray-500 block mb-1">Total</label>}
                  <input
                    type="number"
                    step="0.01"
                    value={item.total_price}
                    readOnly
                    className="w-full bg-gray-800/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-400"
                  />
                </div>
                <div className="col-span-1">
                  {idx === 0 && <label className="text-xs text-gray-500 block mb-1">&nbsp;</label>}
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1.5"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Subtotal</label>
            <input
              type="number"
              step="0.01"
              value={form.subtotal}
              onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Tax</label>
            <input
              type="number"
              step="0.01"
              value={form.tax}
              onChange={(e) => setForm({ ...form, tax: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Total</label>
            <input
              type="number"
              step="0.01"
              value={form.total}
              onChange={(e) => setForm({ ...form, total: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-semibold focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium transition"
        >
          {loading ? "Saving..." : "💾 Save Invoice"}
        </button>
      </div>
    </div>
  );
}
