import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const SQL = `
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

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  name TEXT NOT NULL,
  budget_monthly DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

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
`;

export async function POST() {
  const supabase = createServiceClient();

  const statements = SQL.split(";").map(s => s.trim()).filter(s => s.length > 10);
  const results: string[] = [];

  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" }).maybeSingle();
    if (error) {
      results.push("warn: " + stmt.slice(0, 50) + "... - " + error.message);
    } else {
      results.push("ok: " + stmt.slice(0, 50) + "...");
    }
  }

  const rlsTables = ["waste_reports", "prep_targets", "daily_financials", "expense_categories", "expenses", "financial_reports"];
  for (const t of rlsTables) {
    await supabase.rpc("exec_sql", { sql: "ALTER TABLE " + t + " ENABLE ROW LEVEL SECURITY;" }).maybeSingle();
    await supabase.rpc("exec_sql", { sql: "CREATE POLICY IF NOT EXISTS \"" + t + "_all\" ON " + t + " FOR ALL USING (true) WITH CHECK (true);" }).maybeSingle();
  }

  return NextResponse.json({ ok: true, results, note: "If rpc failed, run migrations/sprint7.sql manually in Supabase SQL editor" });
}
