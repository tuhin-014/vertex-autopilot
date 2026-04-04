import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://app-khaki-pi-37.vercel.app";
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER!;

async function createPaymentLink(order: {
  id: string;
  order_number: number;
  customer_name?: string;
  customer_phone?: string;
  total: number;
  subtotal: number;
  tax: number;
  items: { name?: string; price?: number; quantity?: number; qty?: number }[];
  location_id: string;
}) {
  const supabase = createServiceClient();

  // Build line items
  const lineItems = (order.items || []).map((item) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name || "Menu Item" },
      unit_amount: Math.round((item.price || 0) * 100),
    },
    quantity: item.quantity || item.qty || 1,
  }));

  if (lineItems.length === 0 || lineItems.every((li) => li.price_data.unit_amount === 0)) {
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

  // Create Stripe session
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${BASE_URL}/pay/success?order=${order.order_number}`);
  params.set("cancel_url", `${BASE_URL}/pay/cancel?order=${order.order_number}`);
  params.set("metadata[order_id]", order.id);
  params.set("metadata[order_number]", String(order.order_number));
  params.set("payment_intent_data[metadata][order_id]", order.id);

  lineItems.forEach((item, i) => {
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
  if (session.error) return { error: session.error.message };

  // Save payment link to DB
  await supabase.from("payment_links").insert({
    order_id: order.id,
    stripe_session_id: session.id,
    amount: order.total,
    status: "pending",
    customer_phone: order.customer_phone,
    customer_name: order.customer_name,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });

  // Update order
  await supabase.from("orders").update({
    payment_link: session.url,
    payment_status: "link_sent",
    payment_method: "pending",
  }).eq("id", order.id);

  // Send SMS
  let smsSent = false;
  if (order.customer_phone && TWILIO_SID && TWILIO_TOKEN) {
    try {
      const itemLines = (order.items || []).map(
        (item) => `• ${item.name || "Item"} — $${(item.price || 0).toFixed(2)}`
      );
      const taxAmount = (order.tax as number) || (order.total - order.subtotal);
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
    } catch (e) {
      console.error("SMS error:", e);
    }
  }

  // Log event
  await supabase.from("agent_events").insert({
    agent_type: "payments",
    event_type: "auto_payment_link_sent",
    location_id: order.location_id,
    severity: "info",
    description: `📱 Auto payment link for Order #${order.order_number} — $${order.total.toFixed(2)} ${smsSent ? "(SMS sent)" : "(no SMS)"}`,
    metadata: { order_id: order.id, session_id: session.id, sms_sent: smsSent },
  });

  return { success: true, payment_url: session.url, sms_sent: smsSent };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const channel = searchParams.get("channel");
  const date = searchParams.get("date");
  const locationId = searchParams.get("location_id");

  const supabase = createServiceClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (channel) query = query.eq("channel", channel);
  if (date) query = query.gte("created_at", `${date}T00:00:00`).lte("created_at", `${date}T23:59:59`);
  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createServiceClient();

  // Get next order number for location
  const { data: lastOrder } = await supabase
    .from("orders")
    .select("order_number")
    .eq("location_id", body.location_id)
    .order("order_number", { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (lastOrder?.order_number || 0) + 1;
  const channel = body.channel;

  // Determine payment settings based on channel
  const needsPaymentLink = channel === "phone" || channel === "online";
  const paymentMethod = channel === "walk-in" ? "cash" : channel === "doordash" || channel === "ubereats" || channel === "grubhub" ? "platform" : "pending";
  const paymentStatus = channel === "walk-in" || channel === "doordash" || channel === "ubereats" || channel === "grubhub" ? "paid" : "unpaid";

  const { data, error } = await supabase
    .from("orders")
    .insert({
      location_id: body.location_id,
      order_number: nextNumber,
      channel: channel,
      status: "new",
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      subtotal: body.subtotal,
      tax: body.tax,
      total: body.total,
      items: body.items || [],
      special_instructions: body.special_instructions,
      estimated_prep_mins: body.estimated_prep_mins || 15,
      taken_by: body.taken_by || "Manual",
      // Payment fields
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-send payment link for phone/online orders
  let paymentResult = null;
  if (needsPaymentLink && body.customer_phone) {
    paymentResult = await createPaymentLink({
      ...data,
      location_id: body.location_id,
    });
  }

  return NextResponse.json({
    order: data,
    payment: paymentResult,
  }, { status: 201 });
}
