import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://app-khaki-pi-37.vercel.app";
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER!;

// POST /api/payments/create-link — Generate Stripe checkout + SMS to customer
export async function POST(request: Request) {
  const body = await request.json();
  const { order_id } = body;

  if (!order_id) return NextResponse.json({ error: "order_id required" }, { status: 400 });

  const supabase = createServiceClient();

  // Get order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.payment_status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  // Build line items from order
  const lineItems = (order.items || []).map((item: { name?: string; price?: number; quantity?: number; qty?: number }) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name || "Menu Item" },
      unit_amount: Math.round((item.price || 0) * 100),
    },
    quantity: item.quantity || item.qty || 1,
  }));

  // Fallback: if no item-level pricing, use order total
  if (lineItems.length === 0 || lineItems.every((li: { price_data: { unit_amount: number } }) => li.price_data.unit_amount === 0)) {
    lineItems.length = 0;
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: `Order #${order.order_number}` },
        unit_amount: Math.round((order.total || 0) * 100),
      },
      quantity: 1,
    });
  }

  // Create Stripe checkout session
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${BASE_URL}/pay/success?order=${order.order_number}`);
  params.set("cancel_url", `${BASE_URL}/pay/cancel?order=${order.order_number}`);
  params.set("metadata[order_id]", order.id);
  params.set("metadata[order_number]", String(order.order_number));
  params.set("payment_intent_data[metadata][order_id]", order.id);

  lineItems.forEach((item: { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }, i: number) => {
    params.set(`line_items[${i}][price_data][currency]`, item.price_data.currency);
    params.set(`line_items[${i}][price_data][product_data][name]`, item.price_data.product_data.name);
    params.set(`line_items[${i}][price_data][unit_amount]`, String(item.price_data.unit_amount));
    params.set(`line_items[${i}][quantity]`, String(item.quantity));
  });

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const session = await stripeRes.json();
  if (session.error) return NextResponse.json({ error: session.error.message }, { status: 500 });

  // Save payment link
  const { data: paymentLink } = await supabase.from("payment_links").insert({
    order_id: order.id,
    stripe_session_id: session.id,
    amount: order.total,
    status: "pending",
    customer_phone: order.customer_phone,
    customer_name: order.customer_name,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  }).select().single();

  // Update order with payment link
  await supabase.from("orders").update({
    payment_link: session.url,
    payment_status: "link_sent",
  }).eq("id", order.id);

  // Send SMS if customer has phone
  let smsSent = false;
  if (order.customer_phone && TWILIO_SID && TWILIO_TOKEN) {
    try {
      // Build SMS body with item breakdown
      const itemLines = (order.items || []).map(
        (item: { name?: string; price?: number; quantity?: number; qty?: number }) =>
          `• ${item.name || "Item"} — $${(item.price || 0).toFixed(2)}`
      );
      const taxAmount = (order.tax as number) || (order.total - (order.subtotal || 0));
      const smsBody = `Hi ${order.customer_name || "there"}! Your order #${order.order_number}:\n${itemLines.join("\n")}\n• Tax — $${taxAmount.toFixed(2)}\nTotal due: $${order.total.toFixed(2)}\n\nPay here: ${session.url}\n\nThank you! — IHOP`;
      
      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: order.customer_phone,
            From: TWILIO_FROM,
            Body: smsBody,
          }).toString(),
        }
      );

      const smsResult = await twilioRes.json();
      smsSent = !smsResult.error_code;

      if (paymentLink) {
        await supabase.from("payment_links")
          .update({ sms_sent_at: new Date().toISOString() })
          .eq("id", paymentLink.id);
      }
    } catch (e) {
      console.error("SMS error:", e);
    }
  }

  // Log event
  await supabase.from("agent_events").insert({
    agent_type: "payments",
    event_type: "payment_link_created",
    location_id: order.location_id,
    severity: "info",
    description: `💳 Payment link sent for Order #${order.order_number} — $${order.total.toFixed(2)} ${smsSent ? "(SMS sent)" : "(no SMS)"}`,
    metadata: { order_id: order.id, session_id: session.id, sms_sent: smsSent },
  });

  return NextResponse.json({
    success: true,
    payment_url: session.url,
    session_id: session.id,
    sms_sent: smsSent,
    order_number: order.order_number,
    amount: order.total,
  });
}

// GET /api/payments/create-link?order_id=xxx — Check payment status
export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");

  if (!orderId) return NextResponse.json({ error: "order_id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: link } = await supabase
    .from("payment_links")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!link) return NextResponse.json({ status: "no_link" });

  return NextResponse.json({ payment_link: link });
}
