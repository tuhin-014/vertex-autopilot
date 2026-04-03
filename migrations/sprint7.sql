-- Sprint 7: Waste Manager Agent + Accountant Agent
-- Migration for Vertex Autopilot

-- ═══ WASTE REPORTS ═══
CREATE TABLE IF NOT EXISTS waste_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  report_type TEXT DEFAULT 'weekly',
  period_start DATE,
  period_end DATE,
  total_waste_cost DECIMAL(10,2),
  total_items_wasted INT,
  top_wasted_items JSONB,
  suggestions JSONB,
  waste_pct_of_food_cost DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waste_reports_all" ON waste_reports FOR ALL USING (true) WITH CHECK (true);

-- ═══ PREP TARGETS ═══
CREATE TABLE IF NOT EXISTS prep_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  item_id UUID REFERENCES inventory_items(id),
  day_of_week INT,
  suggested_qty DECIMAL(10,2),
  unit TEXT,
  based_on TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prep_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prep_targets_all" ON prep_targets FOR ALL USING (true) WITH CHECK (true);

-- ═══ DAILY FINANCIALS ═══
CREATE TABLE IF NOT EXISTS daily_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  date DATE NOT NULL,
  revenue DECIMAL(12,2) DEFAULT 0,
  food_cost DECIMAL(12,2) DEFAULT 0,
  labor_cost DECIMAL(12,2) DEFAULT 0,
  other_expenses DECIMAL(12,2) DEFAULT 0,
  net_profit DECIMAL(12,2) DEFAULT 0,
  food_cost_pct DECIMAL(5,2),
  labor_cost_pct DECIMAL(5,2),
  order_count INT DEFAULT 0,
  avg_ticket DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_id, date)
);

ALTER TABLE daily_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_financials_all" ON daily_financials FOR ALL USING (true) WITH CHECK (true);

-- ═══ EXPENSE CATEGORIES ═══
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  budget_monthly DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_categories_all" ON expense_categories FOR ALL USING (true) WITH CHECK (true);

-- ═══ EXPENSES ═══
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  category_id UUID REFERENCES expense_categories(id),
  description TEXT,
  amount DECIMAL(12,2),
  date DATE,
  vendor_id UUID REFERENCES vendors(id),
  invoice_id UUID REFERENCES invoices(id),
  recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  tax_deductible BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_all" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- ═══ FINANCIAL REPORTS ═══
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  report_type TEXT,
  period_start DATE,
  period_end DATE,
  data JSONB,
  alerts JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_reports_all" ON financial_reports FOR ALL USING (true) WITH CHECK (true);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_waste_reports_location ON waste_reports(location_id);
CREATE INDEX IF NOT EXISTS idx_waste_reports_period ON waste_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_prep_targets_location ON prep_targets(location_id);
CREATE INDEX IF NOT EXISTS idx_prep_targets_day ON prep_targets(day_of_week);
CREATE INDEX IF NOT EXISTS idx_daily_financials_location ON daily_financials(location_id);
CREATE INDEX IF NOT EXISTS idx_daily_financials_date ON daily_financials(date);
CREATE INDEX IF NOT EXISTS idx_expenses_location ON expenses(location_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_financial_reports_location ON financial_reports(location_id);
