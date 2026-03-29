import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.text();
  
  try {
    const event = JSON.parse(body);
    const supabase = createServiceClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // Log successful checkout
        await supabase.from("agent_events").insert({
          agent_type: "billing",
          event_type: "subscription_created",
          location_id: null,
          severity: "info",
          description: `💳 New subscription: ${session.customer_email || "customer"} — ${session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}/mo` : "subscription"}`,
          metadata: { session_id: session.id, customer_email: session.customer_email },
        });
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
