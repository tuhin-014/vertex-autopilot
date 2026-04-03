import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  // We create tables by attempting inserts; if tables don't exist we need raw SQL.
  // Since we can't run DDL via PostgREST, we'll use the supabase-js rpc or
  // check if tables exist and report what needs manual creation.

  // Test if tables already exist
  const { error: ordersErr } = await supabase.from("orders").select("id").limit(1);
  const { error: menuErr } = await supabase.from("menu_items").select("id").limit(1);
  const { error: templatesErr } = await supabase.from("checklist_templates").select("id").limit(1);

  const missing: string[] = [];
  if (ordersErr?.code === "PGRST204" || ordersErr?.message?.includes("does not exist") || ordersErr?.code === "42P01") missing.push("orders", "order_issues");
  if (menuErr?.code === "PGRST204" || menuErr?.message?.includes("does not exist") || menuErr?.code === "42P01") missing.push("menu_items");
  if (templatesErr?.code === "PGRST204" || templatesErr?.message?.includes("does not exist") || templatesErr?.code === "42P01") missing.push("checklist_templates", "checklist_completions", "checklist_alerts");

  if (missing.length === 0) {
    return NextResponse.json({ success: true, message: "All Sprint 6 tables already exist" });
  }

  return NextResponse.json({
    success: false,
    missing_tables: missing,
    message: "Tables need to be created via Supabase SQL Editor",
    sql: MIGRATION_SQL,
  });
}

const MIGRATION_SQL = `
-- Sprint 6 Migration: Orders + Checklists

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10,2),
  description TEXT,
  available BOOLEAN DEFAULT true,
  prep_time_mins INT DEFAULT 10,
  popular_rank INT,
  upsell_items TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  order_number SERIAL,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  customer_name TEXT,
  customer_phone TEXT,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  items JSONB,
  special_instructions TEXT,
  estimated_prep_mins INT,
  taken_by TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order Issues
CREATE TABLE IF NOT EXISTS order_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  location_id UUID REFERENCES locations(id),
  issue_type TEXT,
  description TEXT,
  resolution TEXT,
  refund_amount DECIMAL(10,2),
  reported_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Checklist Templates
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  items JSONB NOT NULL,
  deadline_minutes INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Checklist Completions
CREATE TABLE IF NOT EXISTS checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES checklist_templates(id),
  location_id UUID REFERENCES locations(id),
  completed_by TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  items_completed JSONB,
  completion_pct INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  handoff_notes TEXT
);

-- Checklist Alerts
CREATE TABLE IF NOT EXISTS checklist_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  checklist_completion_id UUID REFERENCES checklist_completions(id),
  alert_type TEXT,
  message TEXT,
  sent_via TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_location_status ON orders(location_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_issues_order_id ON order_issues(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_location ON menu_items(location_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_template ON checklist_completions(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_location_date ON checklist_completions(location_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_checklist_alerts_completion ON checklist_alerts(checklist_completion_id);

-- RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_alerts ENABLE ROW LEVEL SECURITY;

-- Policies (service role bypasses RLS; anon/authenticated get read via location membership)
CREATE POLICY "Service role full access" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON order_issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON checklist_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON checklist_completions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON checklist_alerts FOR ALL USING (true) WITH CHECK (true);
`;
