import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";

// POST /api/webhook/retell — Retell AI post-call webhook
// Creates an order from AI phone call data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    // Extract from Retell's webhook format
    const callData = body.call || body;
    const callId = callData.call_id || callData.retell_call_id || "";
    const callerPhone = callData.from_number || callData.caller_phone || callData.customer_phone || "";
    const duration = callData.call_duration_seconds || callData.duration || callData.call_duration || 0;
    const transcript = body.transcript || callData.transcript || "";
    const toNumber = callData.to_number || "";

    // Extract order data from call analysis
    const analysis = callData.call_analysis || body.call_analysis || {};
    const customData = analysis.custom_analysis_data || {};
    const customerName = customData.customer_name || analysis.customer_name || body.customer_name || "Phone Customer";
    const rawItems = customData.order_items || analysis.order_items || callData.items || body.items || [];
    const orderNotes = customData.order_notes || analysis.order_notes || "";
    const orderType = customData.order_type || analysis.order_type || "pickup";

    // Parse items
    let parsedItems: { name: string; quantity: number; price: number; modifications?: string[] }[] = [];
    try {
      parsedItems = typeof rawItems === "string" ? JSON.parse(rawItems || "[]") : Array.isArray(rawItems) ? rawItems : [];
    } catch {
      parsedItems = [];
    }

    const hasOrder = parsedItems.length > 0;

    if (!hasOrder) {
      // Just a call with no order — log it as an agent event
      await supabase.from("agent_events").insert({
        agent_type: "order",
        event_type: "phone_call_no_order",
        severity: "info",
        description: `📞 Phone call from ${callerPhone || "unknown"} (${duration}s) — no order placed`,
        action_taken: "Call logged",
        metadata: { call_id: callId, caller_phone: callerPhone, duration, transcript: transcript.slice(0, 500) },
      });

      return NextResponse.json({ success: true, message: "Call logged (no order)" });
    }

    // Calculate totals
    const subtotal = parsedItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
    const taxRate = 0.08;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Get default location (first location)
    const { data: locations } = await supabase.from("locations").select("id").limit(1);
    const locationId = locations?.[0]?.id;

    if (!locationId) {
      return NextResponse.json({ success: false, error: "No location found" }, { status: 400 });
    }

    // Get next order number
    const { data: lastOrder } = await supabase
      .from("orders")
      .select("order_number")
      .eq("location_id", locationId)
      .order("order_number", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastOrder?.order_number || 0) + 1;

    // Create the order
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        location_id: locationId,
        order_number: nextNumber,
        channel: "phone",
        status: "new",
        customer_name: customerName,
        customer_phone: callerPhone,
        subtotal,
        tax,
        total,
        items: parsedItems,
        special_instructions: [orderNotes, orderType !== "pickup" ? `Type: ${orderType}` : ""].filter(Boolean).join(" | ") || null,
        estimated_prep_mins: 20,
        taken_by: "Retell AI",
      })
      .select()
      .single();

    if (error) {
      console.error("[Retell Webhook] Order creation failed:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Log agent event
    await supabase.from("agent_events").insert({
      agent_type: "order",
      event_type: "phone_order_received",
      location_id: locationId,
      severity: "info",
      description: `📞 Phone order #${nextNumber} from ${customerName} — ${parsedItems.length} items, $${total.toFixed(2)} (via Retell AI)`,
      action_taken: "Order created and queued",
      metadata: {
        order_id: order?.id,
        order_number: nextNumber,
        call_id: callId,
        caller_phone: callerPhone,
        duration,
        items: parsedItems.map((i) => `${i.quantity}x ${i.name}`),
        total,
      },
    });

    // Send SMS notification to manager via Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;
    const managerPhone = process.env.REGIONAL_MANAGER_EMAIL ? null : "+13472387999"; // fallback

    if (twilioSid && twilioAuth && twilioFrom && managerPhone) {
      try {
        const smsBody = [
          `🔔 New Phone Order #${nextNumber}!`,
          `👤 ${customerName}`,
          callerPhone ? `📞 ${callerPhone}` : "",
          `🍕 ${parsedItems.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`,
          `💰 $${total.toFixed(2)}`,
          orderNotes ? `📝 ${orderNotes}` : "",
          ``,
          `View: https://app-khaki-pi-37.vercel.app/dashboard/orders`,
        ]
          .filter(Boolean)
          .join("\n");

        const params = new URLSearchParams({ To: managerPhone, From: twilioFrom, Body: smsBody });
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
      } catch (smsErr) {
        console.error("[Retell Webhook] SMS failed:", smsErr);
      }
    }

    // Send confirmation SMS to customer
    if (callerPhone && twilioSid && twilioAuth && twilioFrom) {
      try {
        const confirmBody = `✅ Order #${nextNumber} confirmed! Your total is $${total.toFixed(2)}. Estimated pickup: ~20 min. Thank you! 🍽️`;
        const params = new URLSearchParams({ To: callerPhone, From: twilioFrom, Body: confirmBody });
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
      } catch {}
    }

    console.log(`[Retell Webhook] Order #${nextNumber} created — ${parsedItems.length} items, $${total.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      order_number: nextNumber,
      order_id: order?.id,
      items_count: parsedItems.length,
      total,
      message: `Order #${nextNumber} created`,
    });
  } catch (err) {
    console.error("[Retell Webhook Error]", err);
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

// GET for health check
export async function GET() {
  return NextResponse.json({ status: "ok", service: "Vertex Autopilot Retell Webhook" });
}
