import { NextResponse } from "next/server";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vertex-autopilot.vercel.app";

const PLANS: Record<string, { priceId: string; name: string }> = {
  starter: { priceId: "price_1TGEZ2HbNZW1WszzOyGNfRRC", name: "Autopilot Starter" },
  pro: { priceId: "price_1TGEZ3HbNZW1WszzmtQ1WTHH", name: "Autopilot Pro" },
  enterprise: { priceId: "price_1TGEZ3HbNZW1WszztEN2jiFZ", name: "Autopilot Enterprise" },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { plan, stores = 1, email } = body;

  const planData = PLANS[plan];
  if (!planData) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "mode": "subscription",
      "success_url": `${BASE_URL}/dashboard?checkout=success`,
      "cancel_url": `${BASE_URL}/dashboard/settings?checkout=cancelled`,
      "line_items[0][price]": planData.priceId,
      "line_items[0][quantity]": String(stores),
      ...(email ? { "customer_email": email } : {}),
    }),
  });

  const session = await res.json();
  if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
