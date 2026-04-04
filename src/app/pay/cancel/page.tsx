"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CancelContent() {
  const params = useSearchParams();
  const orderNum = params.get("order");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-6">😕</div>
        <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
        {orderNum && <p className="text-xl text-gray-400 mb-4">Order #{orderNum}</p>}
        <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <p className="text-yellow-400 font-medium mb-2">Your payment was not completed</p>
          <p className="text-gray-400 text-sm">No charges were made. Your order is still on hold. You can call us back to pay or check the payment link in your text messages.</p>
        </div>
        <p className="text-xs text-gray-600 mt-8">If you need help, call us directly. — IHOP</p>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>}>
      <CancelContent />
    </Suspense>
  );
}
