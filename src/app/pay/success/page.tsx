"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const orderNum = params.get("order");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-7xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-2">Payment Confirmed!</h1>
        {orderNum && <p className="text-xl text-blue-400 mb-4">Order #{orderNum}</p>}
        <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-6 mb-6">
          <p className="text-green-400 font-medium mb-2">Your payment has been received</p>
          <p className="text-gray-400 text-sm">We&apos;re preparing your order now. You&apos;ll receive a text message when it&apos;s ready for pickup!</p>
        </div>
        <div className="space-y-3 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <span>🍳</span>
            <span>Kitchen is preparing your order</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>📱</span>
            <span>You&apos;ll get a text when it&apos;s ready</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>🧾</span>
            <span>Receipt sent to your email</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-8">Thank you for your order! — IHOP</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
