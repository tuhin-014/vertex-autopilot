import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createServiceClient();
  const results: string[] = [];

  // Test if payment columns exist by trying to select them
  const { error: testErr } = await supabase.from("orders").select("payment_status").limit(1);
  
  if (testErr && testErr.message.includes("payment_status")) {
    results.push("⚠️ Payment columns need to be added via Supabase SQL editor");
    results.push("Run this SQL in Supabase Dashboard → SQL Editor:");
    results.push(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id text;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip numeric DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link text;
      
      CREATE TABLE IF NOT EXISTS payment_links (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
        stripe_session_id text,
        stripe_payment_intent_id text,
        amount numeric NOT NULL,
        status text DEFAULT 'pending',
        customer_phone text,
        customer_name text,
        sms_sent_at timestamptz,
        paid_at timestamptz,
        expires_at timestamptz,
        created_at timestamptz DEFAULT now()
      );
      ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
      CREATE POLICY service_all_payment_links ON payment_links FOR ALL USING (true) WITH CHECK (true);
    `);
  } else {
    results.push("✅ Payment columns already exist on orders table");
  }

  // Test payment_links table
  const { error: plTest } = await supabase.from("payment_links").select("id").limit(1);
  if (plTest) {
    results.push("⚠️ payment_links table needs creation");
  } else {
    results.push("✅ payment_links table exists");
  }

  // Update existing orders with payment info based on channel
  const { data: orders } = await supabase.from("orders").select("id, channel, payment_status");
  
  let updated = 0;
  for (const order of orders || []) {
    if (order.payment_status && order.payment_status !== 'unpaid') continue;
    
    let payment_method = 'pending';
    let payment_status = 'unpaid';
    
    if (['doordash', 'ubereats', 'grubhub'].includes(order.channel)) {
      payment_method = 'platform';
      payment_status = 'paid';
    } else if (order.channel === 'walk-in') {
      payment_method = 'cash';
      payment_status = 'paid';
    }
    
    const { error } = await supabase.from("orders").update({ payment_method, payment_status }).eq("id", order.id);
    if (!error) updated++;
  }
  
  results.push(`Updated ${updated} orders with payment info`);

  return NextResponse.json({ success: true, results });
}
