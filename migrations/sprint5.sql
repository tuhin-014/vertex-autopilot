-- Sprint 5: Invoice Manager Agent + Inventory Agent
-- Migration for Vertex Autopilot

-- ═══ VENDORS ═══
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  category TEXT,
  payment_terms TEXT,
  account_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_all" ON vendors FOR ALL USING (true) WITH CHECK (true);

-- ═══ INVOICES ═══
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  vendor_id UUID REFERENCES vendors(id),
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  ocr_raw JSONB,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_all" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- ═══ INVOICE ITEMS ═══
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT,
  quantity DECIMAL(10,3),
  unit TEXT,
  unit_price DECIMAL(10,4),
  total_price DECIMAL(10,2),
  previous_price DECIMAL(10,4),
  price_change_pct DECIMAL(5,2)
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_items_all" ON invoice_items FOR ALL USING (true) WITH CHECK (true);

-- ═══ VENDOR PRICE HISTORY ═══
CREATE TABLE IF NOT EXISTS vendor_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  item_description TEXT,
  unit_price DECIMAL(10,4),
  unit TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vendor_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendor_price_history_all" ON vendor_price_history FOR ALL USING (true) WITH CHECK (true);

-- ═══ INVENTORY ITEMS ═══
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  par_level DECIMAL(10,2),
  max_level DECIMAL(10,2),
  current_stock DECIMAL(10,2) DEFAULT 0,
  unit_cost DECIMAL(10,4),
  preferred_vendor_id UUID REFERENCES vendors(id),
  reorder_lead_days INT DEFAULT 2,
  shelf_life_days INT,
  storage_location TEXT,
  last_counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_items_all" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

-- ═══ INVENTORY COUNTS ═══
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  item_id UUID REFERENCES inventory_items(id),
  counted_by TEXT,
  counted_qty DECIMAL(10,2),
  system_qty DECIMAL(10,2),
  variance DECIMAL(10,2),
  notes TEXT,
  counted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_counts_all" ON inventory_counts FOR ALL USING (true) WITH CHECK (true);

-- ═══ WASTE LOGS ═══
CREATE TABLE IF NOT EXISTS waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  item_id UUID REFERENCES inventory_items(id),
  quantity DECIMAL(10,2),
  unit TEXT,
  reason TEXT,
  estimated_cost DECIMAL(10,2),
  logged_by TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waste_logs_all" ON waste_logs FOR ALL USING (true) WITH CHECK (true);

-- ═══ PURCHASE ORDERS ═══
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  vendor_id UUID REFERENCES vendors(id),
  status TEXT DEFAULT 'draft',
  total_estimated DECIMAL(10,2),
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_orders_all" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- ═══ PURCHASE ORDER ITEMS ═══
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id),
  quantity DECIMAL(10,2),
  unit TEXT,
  estimated_unit_cost DECIMAL(10,4),
  estimated_total DECIMAL(10,2)
);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_order_items_all" ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors(location_id);
CREATE INDEX IF NOT EXISTS idx_invoices_location ON invoices(location_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_vendor_price_history_vendor ON vendor_price_history(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_vendor ON inventory_items(preferred_vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_item ON inventory_counts(item_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_location ON waste_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_item ON waste_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_location ON purchase_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);
