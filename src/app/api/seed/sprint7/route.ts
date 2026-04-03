import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createServiceClient();
  const results: string[] = [];

  // Get a location ID
  const { data: locs } = await supabase.from("locations").select("id").limit(1);
  const locId = locs?.[0]?.id;
  if (!locId) return NextResponse.json({ error: "No locations found" }, { status: 400 });

  // Get inventory items for waste/prep
  const { data: items } = await supabase.from("inventory_items").select("id, name, unit").limit(10);

  // 1. Seed expense categories
  const categories = [
    { location_id: locId, name: "Food & Beverage", budget_monthly: 25000 },
    { location_id: locId, name: "Labor", budget_monthly: 22000 },
    { location_id: locId, name: "Rent", budget_monthly: 8000 },
    { location_id: locId, name: "Utilities", budget_monthly: 3000 },
    { location_id: locId, name: "Marketing", budget_monthly: 2000 },
    { location_id: locId, name: "Insurance", budget_monthly: 1500 },
    { location_id: locId, name: "Supplies", budget_monthly: 1200 },
    { location_id: locId, name: "Maintenance", budget_monthly: 1000 },
    { location_id: locId, name: "Taxes & Licenses", budget_monthly: 800 },
    { location_id: locId, name: "Other", budget_monthly: 500 },
  ];
  const { data: cats } = await supabase.from("expense_categories").insert(categories).select();
  results.push(`✅ ${cats?.length || 0} expense categories`);

  // 2. Seed 30 days of daily financials
  const financials = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const baseRevenue = isWeekend ? 6500 : 4500;
    const revenue = baseRevenue + Math.round((Math.random() - 0.5) * 2000);
    const foodCost = Math.round(revenue * (0.28 + Math.random() * 0.08));
    const laborCost = Math.round(revenue * (0.26 + Math.random() * 0.06));
    const otherExp = Math.round(revenue * 0.08);
    const netProfit = revenue - foodCost - laborCost - otherExp;
    const orderCount = Math.round(revenue / (isWeekend ? 22 : 18));

    financials.push({
      location_id: locId,
      date: d.toISOString().split("T")[0],
      revenue, food_cost: foodCost, labor_cost: laborCost,
      other_expenses: otherExp, net_profit: netProfit,
      food_cost_pct: Math.round((foodCost / revenue) * 1000) / 10,
      labor_cost_pct: Math.round((laborCost / revenue) * 1000) / 10,
      order_count: orderCount,
      avg_ticket: Math.round((revenue / orderCount) * 100) / 100,
    });
  }
  const { data: fins } = await supabase.from("daily_financials").upsert(financials, { onConflict: "location_id,date" }).select();
  results.push(`✅ ${fins?.length || 0} daily financials`);

  // 3. Seed expenses
  const expenseData = [];
  if (cats && cats.length > 0) {
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const d = new Date();
      d.setDate(now.getDate() - Math.floor(Math.random() * 30));
      const cat = cats[Math.floor(Math.random() * cats.length)];
      const descriptions = ["Weekly produce delivery", "Staff uniforms", "Grease trap service", "Menu printing", "POS system fee", "Pest control", "Linen service", "Equipment repair", "Social media ads", "Legal consultation", "Cleaning supplies", "To-go containers", "Register tape", "Light bulbs", "Plumber visit", "Fire extinguisher inspection", "Music license", "Window cleaning", "Trash removal", "Flower arrangement"];
      expenseData.push({
        location_id: locId,
        category_id: cat.id,
        description: descriptions[i],
        amount: Math.round((50 + Math.random() * 500) * 100) / 100,
        date: d.toISOString().split("T")[0],
        tax_deductible: Math.random() > 0.2,
      });
    }
    const { data: exps } = await supabase.from("expenses").insert(expenseData).select();
    results.push(`✅ ${exps?.length || 0} expenses`);
  }

  // 4. Seed waste reports
  const wasteReports = [
    {
      location_id: locId, report_type: "weekly",
      period_start: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
      period_end: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
      total_waste_cost: 347.50, total_items_wasted: 23,
      top_wasted_items: [{ name: "Lettuce", qty: 8, cost: 45.60 }, { name: "Tomatoes", qty: 6, cost: 32.40 }, { name: "Chicken Breast", qty: 4, cost: 89.20 }],
      suggestions: [{ suggestion: "Reduce lettuce order by 20%", estimated_savings: 27.36 }, { suggestion: "Use FIFO for chicken — 4 units expired", estimated_savings: 53.52 }],
      waste_pct_of_food_cost: 3.2,
    },
    {
      location_id: locId, report_type: "weekly",
      period_start: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
      period_end: new Date().toISOString().split("T")[0],
      total_waste_cost: 289.00, total_items_wasted: 18,
      top_wasted_items: [{ name: "Mixed Greens", qty: 5, cost: 28.50 }, { name: "Shrimp", qty: 3, cost: 67.80 }, { name: "Bread Rolls", qty: 12, cost: 24.00 }],
      suggestions: [{ suggestion: "Reduce shrimp prep by 15% on weekdays", estimated_savings: 40.68 }, { suggestion: "Bread rolls: switch to par-bake for longer shelf life", estimated_savings: 14.40 }],
      waste_pct_of_food_cost: 2.7,
    },
  ];
  const { data: wr } = await supabase.from("waste_reports").insert(wasteReports).select();
  results.push(`✅ ${wr?.length || 0} waste reports`);

  // 5. Seed prep targets
  if (items && items.length > 0) {
    const prepData = [];
    for (let day = 0; day < 7; day++) {
      for (const item of items.slice(0, 5)) {
        const isWeekend = day === 0 || day === 5 || day === 6;
        prepData.push({
          location_id: locId,
          item_id: item.id,
          day_of_week: day,
          suggested_qty: isWeekend ? Math.round(15 + Math.random() * 10) : Math.round(10 + Math.random() * 8),
          unit: item.unit || "each",
          based_on: "sales_avg",
        });
      }
    }
    const { data: pt } = await supabase.from("prep_targets").insert(prepData).select();
    results.push(`✅ ${pt?.length || 0} prep targets`);
  }

  // 6. Seed financial reports
  const finReports = [
    {
      location_id: locId, report_type: "weekly_pnl",
      period_start: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
      period_end: new Date().toISOString().split("T")[0],
      data: { revenue: 38500, food_cost: 11550, labor_cost: 10780, other: 3080, net_profit: 13090, food_pct: 30, labor_pct: 28 },
      alerts: [{ type: "info", message: "Food cost trending down — good week!" }],
    },
    {
      location_id: locId, report_type: "monthly_pnl",
      period_start: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      period_end: new Date().toISOString().split("T")[0],
      data: { revenue: 158000, food_cost: 49000, labor_cost: 44240, other: 12640, net_profit: 52120, food_pct: 31, labor_pct: 28 },
      alerts: [],
    },
  ];
  const { data: fr } = await supabase.from("financial_reports").insert(finReports).select();
  results.push(`✅ ${fr?.length || 0} financial reports`);

  return NextResponse.json({ ok: true, results });
}
