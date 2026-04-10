import { NextResponse } from "next/server";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vertex-autopilot.vercel.app";

const PLANS: Record<string, { priceId: string; name: string }> = {
  starter: { priceId: "price_1TKVDbHbNZW1WszzLHu7yvHI", name: "Vertex Autopilot Starter" },
  growth: { priceId: "price_1TKVDcHbNZW1WszzfLH3Oja5", name: "Vertex Autopilot Growth" },
  enterprise: { priceId: "price_1TKVDdHbNZW1WszzFM0I7SJq", name: "Vertex Autopilot Enterprise" },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { plan, email } = body;

  const planData = PLANS[plan];
  if (!planData) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  if (!STRIPE_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "mode": "subscription",
      "success_url": `${BASE_URL}/pay/success?plan=${plan}`,
      "cancel_url": `${BASE_URL}/pay/cancel`,
      "line_items[0][price]": planData.priceId,
      "line_items[0][quantity]": "1",
      ...(email ? { "customer_email": email } : {}),
    }),
  });

  const session = await res.json();
  if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
