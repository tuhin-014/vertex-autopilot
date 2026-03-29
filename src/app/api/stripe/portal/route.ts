import { NextResponse } from "next/server";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const BASE_URL = "https://vertex-autopilot.vercel.app";

export async function POST(request: Request) {
  const body = await request.json();
  const { customer_id, email } = body;

  // If we have a customer ID, create portal session directly
  if (customer_id) {
    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customer_id,
        return_url: `${BASE_URL}/dashboard/settings`,
      }),
    });
    const session = await res.json();
    if (session.url) return NextResponse.json({ url: session.url });
    return NextResponse.json({ error: session.error?.message || "Portal creation failed" }, { status: 500 });
  }

  // Find customer by email
  if (email) {
    const res = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${email}'`, {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` },
    });
    const data = await res.json();
    const customer = data.data?.[0];
    if (!customer) return NextResponse.json({ error: "No Stripe customer found for this email" }, { status: 404 });

    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customer.id,
        return_url: `${BASE_URL}/dashboard/settings`,
      }),
    });
    const session = await portalRes.json();
    if (session.url) return NextResponse.json({ url: session.url });
    return NextResponse.json({ error: session.error?.message || "Portal creation failed" }, { status: 500 });
  }

  return NextResponse.json({ error: "customer_id or email required" }, { status: 400 });
}
