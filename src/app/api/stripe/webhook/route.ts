import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER!;

async function sendSMS(to: string, body: string) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !to) return false;
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }).toString(),
    });
    return true;
  } catch { return false; }
}

export async function POST(request: Request) {
  const body = await request.text();
  
  try {
    const event = JSON.parse(body);
    const supabase = createServiceClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;
        const orderNumber = session.metadata?.order_number;

        if (orderId) {
          // ===== ORDER PAYMENT (Text-to-Pay) =====
          const now = new Date().toISOString();

          // Update order to PAID
          await supabase.from("orders").update({
            payment_status: "paid",
            payment_method: "card_online",
            payment_id: session.payment_intent,
            paid_at: now,
          }).eq("id", orderId);

          // Update payment_links
          await supabase.from("payment_links").update({
            status: "paid",
            stripe_payment_intent_id: session.payment_intent,
            paid_at: now,
          }).eq("stripe_session_id", session.id);

          // Get order for SMS confirmation
          const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();

          // Send payment confirmation SMS
          if (order?.customer_phone) {
            await sendSMS(
              order.customer_phone,
              `✅ Payment confirmed for Order #${orderNumber}! Total: $${(session.amount_total / 100).toFixed(2)}. We're preparing your order now. We'll text you when it's ready! — IHOP`
            );
          }

          // Log event
          await supabase.from("agent_events").insert({
            agent_type: "payments",
            event_type: "payment_received",
            location_id: order?.location_id || null,
            severity: "info",
            description: `✅ Payment received: Order #${orderNumber} — $${(session.amount_total / 100).toFixed(2)} via card`,
            metadata: { order_id: orderId, session_id: session.id, payment_intent: session.payment_intent },
          });

          // Auto-update order to "preparing" since payment is confirmed
          if (order?.status === "new") {
            await supabase.from("orders").update({ status: "preparing" }).eq("id", orderId);
          }

        } else {
          // ===== SUBSCRIPTION PAYMENT (SaaS plan) =====
          await supabase.from("agent_events").insert({
            agent_type: "billing",
            event_type: "subscription_created",
            location_id: null,
            severity: "info",
            description: `💳 New subscription: ${session.customer_email || "customer"} — ${session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}/mo` : "subscription"}`,
            metadata: { session_id: session.id, customer_email: session.customer_email },
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          // Payment link expired
          await supabase.from("orders").update({ payment_status: "expired" }).eq("id", orderId);
          await supabase.from("payment_links").update({ status: "expired" }).eq("stripe_session_id", session.id);

          await supabase.from("agent_events").insert({
            agent_type: "payments",
            event_type: "payment_expired",
            location_id: null,
            severity: "warning",
            description: `⚠️ Payment expired: Order #${session.metadata?.order_number}`,
            metadata: { order_id: orderId, session_id: session.id },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabase.from("agent_events").insert({
          agent_type: "billing",
          event_type: "subscription_cancelled",
          location_id: null,
          severity: "warning",
          description: `⚠️ Subscription cancelled: ${sub.id}`,
          metadata: { subscription_id: sub.id },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
