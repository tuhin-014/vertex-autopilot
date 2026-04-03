-- Sprint 6: Order Manager + Opening/Closing Manager Agent
-- Migration for Vertex Autopilot

-- ═══ MENU ITEMS ═══
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

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items_all" ON menu_items FOR ALL USING (true) WITH CHECK (true);

-- ═══ ORDERS ═══
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

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_all" ON orders FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orders_location_status ON orders(location_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ═══ ORDER ISSUES ═══
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

ALTER TABLE order_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_issues_all" ON order_issues FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_order_issues_order_id ON order_issues(order_id);
CREATE INDEX IF NOT EXISTS idx_order_issues_location ON order_issues(location_id);

-- ═══ CHECKLIST TEMPLATES ═══
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  items JSONB NOT NULL,
  deadline_minutes INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_templates_all" ON checklist_templates FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_location ON checklist_templates(location_id);

-- ═══ CHECKLIST COMPLETIONS ═══
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

ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_completions_all" ON checklist_completions FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_checklist_completions_template ON checklist_completions(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_location_date ON checklist_completions(location_id, shift_date DESC);

-- ═══ CHECKLIST ALERTS ═══
CREATE TABLE IF NOT EXISTS checklist_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  checklist_completion_id UUID REFERENCES checklist_completions(id),
  alert_type TEXT,
  message TEXT,
  sent_via TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE checklist_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_alerts_all" ON checklist_alerts FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_checklist_alerts_completion ON checklist_alerts(checklist_completion_id);
