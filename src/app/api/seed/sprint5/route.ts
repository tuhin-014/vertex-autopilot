import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  // Get first location
  const { data: locations } = await supabase.from("locations").select("id").limit(1);
  const locationId = locations?.[0]?.id;
  if (!locationId) return NextResponse.json({ error: "No locations found — seed locations first" }, { status: 400 });

  // ═══ 10 VENDORS ═══
  const vendorData = [
    { name: "Sysco Foods", contact_name: "Mike Johnson", contact_email: "mike@sysco.com", contact_phone: "555-0101", category: "food", payment_terms: "net30", account_number: "SYS-40291" },
    { name: "US Foods", contact_name: "Sarah Chen", contact_email: "sarah@usfoods.com", contact_phone: "555-0102", category: "food", payment_terms: "net30", account_number: "USF-8821" },
    { name: "Coca-Cola Bottling", contact_name: "James Rivera", contact_email: "james@coca-cola.com", contact_phone: "555-0103", category: "beverage", payment_terms: "net15", account_number: "CC-1192" },
    { name: "PepsiCo Beverages", contact_name: "Lisa Park", contact_email: "lisa@pepsico.com", contact_phone: "555-0104", category: "beverage", payment_terms: "net15", account_number: "PEP-3304" },
    { name: "Fresh Valley Produce", contact_name: "Carlos Mendez", contact_email: "carlos@freshvalley.com", contact_phone: "555-0105", category: "food", payment_terms: "cod", account_number: "FVP-112" },
    { name: "Metro Bakery Supply", contact_name: "Anna Kim", contact_email: "anna@metrobakery.com", contact_phone: "555-0106", category: "food", payment_terms: "net15", account_number: "MBS-770" },
    { name: "CleanPro Solutions", contact_name: "Dave Wilson", contact_email: "dave@cleanpro.com", contact_phone: "555-0107", category: "cleaning", payment_terms: "net30", account_number: "CPS-221" },
    { name: "Pacific Paper Co", contact_name: "Wei Zhang", contact_email: "wei@pacificpaper.com", contact_phone: "555-0108", category: "supplies", payment_terms: "net30", account_number: "PPC-456" },
    { name: "Restaurant Equipment Direct", contact_name: "Tom Brady", contact_email: "tom@reqdirect.com", contact_phone: "555-0109", category: "equipment", payment_terms: "net30", account_number: "RED-890" },
    { name: "Local Dairy Farm", contact_name: "Maria Santos", contact_email: "maria@localdairy.com", contact_phone: "555-0110", category: "food", payment_terms: "cod", account_number: "LDF-033" },
  ];

  const { data: vendors } = await supabase
    .from("vendors")
    .upsert(vendorData.map((v) => ({ ...v, location_id: locationId })), { onConflict: "id" })
    .select("id, name");

  if (!vendors || vendors.length === 0) return NextResponse.json({ error: "Failed to seed vendors" }, { status: 500 });

  const vendorMap: Record<string, string> = {};
  for (const v of vendors) vendorMap[v.name] = v.id;

  // ═══ 50 INVENTORY ITEMS ═══
  const inventoryData = [
    // Produce (8)
    { name: "Romaine Lettuce", category: "produce", unit: "case", par_level: 8, max_level: 15, current_stock: 6, unit_cost: 24.50, preferred_vendor: "Fresh Valley Produce", shelf_life_days: 5, storage_location: "walk-in" },
    { name: "Tomatoes", category: "produce", unit: "case", par_level: 6, max_level: 12, current_stock: 3, unit_cost: 28.00, preferred_vendor: "Fresh Valley Produce", shelf_life_days: 7, storage_location: "walk-in" },
    { name: "Onions (Yellow)", category: "produce", unit: "bag", par_level: 4, max_level: 8, current_stock: 5, unit_cost: 12.00, preferred_vendor: "Fresh Valley Produce", shelf_life_days: 21, storage_location: "dry storage" },
    { name: "Potatoes (Russet)", category: "produce", unit: "bag", par_level: 6, max_level: 10, current_stock: 7, unit_cost: 15.00, preferred_vendor: "Sysco Foods", shelf_life_days: 30, storage_location: "dry storage" },
    { name: "Bell Peppers (Mixed)", category: "produce", unit: "case", par_level: 4, max_level: 8, current_stock: 2, unit_cost: 32.00, preferred_vendor: "Fresh Valley Produce", shelf_life_days: 7, storage_location: "walk-in" },
    { name: "Avocados", category: "produce", unit: "case", par_level: 3, max_level: 6, current_stock: 1, unit_cost: 45.00, preferred_vendor: "Fresh Valley Produce", shelf_life_days: 4, storage_location: "walk-in" },
    { name: "Lemons", category: "produce", unit: "case", par_level: 2, max_level: 4, current_stock: 3, unit_cost: 22.00, preferred_vendor: "Fresh Valley Produce", shelf_life_days: 14, storage_location: "walk-in" },
    { name: "Fresh Herbs (Mixed)", category: "produce", unit: "each", par_level: 10, max_level: 20, current_stock: 4, unit_cost: 3.50, preferred_vendor: "Fresh Valley Produce", shelf_life_days: 3, storage_location: "walk-in" },
    // Meat (7)
    { name: "Chicken Breast", category: "meat", unit: "case", par_level: 10, max_level: 18, current_stock: 5, unit_cost: 65.00, preferred_vendor: "Sysco Foods", shelf_life_days: 3, storage_location: "walk-in" },
    { name: "Ground Beef 80/20", category: "meat", unit: "case", par_level: 8, max_level: 14, current_stock: 9, unit_cost: 78.00, preferred_vendor: "Sysco Foods", shelf_life_days: 3, storage_location: "walk-in" },
    { name: "Bacon (Thick Cut)", category: "meat", unit: "case", par_level: 4, max_level: 8, current_stock: 3, unit_cost: 52.00, preferred_vendor: "US Foods", shelf_life_days: 7, storage_location: "walk-in" },
    { name: "Salmon Filets", category: "meat", unit: "lb", par_level: 15, max_level: 25, current_stock: 8, unit_cost: 14.50, preferred_vendor: "US Foods", shelf_life_days: 2, storage_location: "walk-in" },
    { name: "Shrimp (16/20)", category: "meat", unit: "lb", par_level: 10, max_level: 20, current_stock: 12, unit_cost: 12.00, preferred_vendor: "Sysco Foods", shelf_life_days: 2, storage_location: "freezer" },
    { name: "Pork Ribs", category: "meat", unit: "case", par_level: 4, max_level: 8, current_stock: 2, unit_cost: 85.00, preferred_vendor: "Sysco Foods", shelf_life_days: 3, storage_location: "walk-in" },
    { name: "Turkey Breast (Deli)", category: "meat", unit: "lb", par_level: 8, max_level: 15, current_stock: 10, unit_cost: 8.50, preferred_vendor: "US Foods", shelf_life_days: 5, storage_location: "walk-in" },
    // Dairy (6)
    { name: "Whole Milk", category: "dairy", unit: "gallon", par_level: 10, max_level: 20, current_stock: 7, unit_cost: 4.50, preferred_vendor: "Local Dairy Farm", shelf_life_days: 7, storage_location: "walk-in" },
    { name: "Heavy Cream", category: "dairy", unit: "gallon", par_level: 4, max_level: 8, current_stock: 2, unit_cost: 8.00, preferred_vendor: "Local Dairy Farm", shelf_life_days: 7, storage_location: "walk-in" },
    { name: "Cheddar Cheese (Shredded)", category: "dairy", unit: "bag", par_level: 8, max_level: 15, current_stock: 6, unit_cost: 6.50, preferred_vendor: "Sysco Foods", shelf_life_days: 14, storage_location: "walk-in" },
    { name: "Mozzarella Cheese", category: "dairy", unit: "lb", par_level: 12, max_level: 20, current_stock: 14, unit_cost: 5.00, preferred_vendor: "Sysco Foods", shelf_life_days: 14, storage_location: "walk-in" },
    { name: "Butter (Unsalted)", category: "dairy", unit: "lb", par_level: 10, max_level: 20, current_stock: 8, unit_cost: 4.00, preferred_vendor: "Local Dairy Farm", shelf_life_days: 30, storage_location: "walk-in" },
    { name: "Eggs (Large)", category: "dairy", unit: "case", par_level: 6, max_level: 10, current_stock: 4, unit_cost: 18.00, preferred_vendor: "Local Dairy Farm", shelf_life_days: 21, storage_location: "walk-in" },
    // Dry Goods (10)
    { name: "All-Purpose Flour", category: "dry_goods", unit: "bag", par_level: 4, max_level: 8, current_stock: 5, unit_cost: 8.00, preferred_vendor: "Sysco Foods", shelf_life_days: 180, storage_location: "dry storage" },
    { name: "White Rice", category: "dry_goods", unit: "bag", par_level: 4, max_level: 8, current_stock: 6, unit_cost: 12.00, preferred_vendor: "Sysco Foods", shelf_life_days: 365, storage_location: "dry storage" },
    { name: "Pasta (Penne)", category: "dry_goods", unit: "case", par_level: 3, max_level: 6, current_stock: 4, unit_cost: 15.00, preferred_vendor: "Sysco Foods", shelf_life_days: 365, storage_location: "dry storage" },
    { name: "Olive Oil (Extra Virgin)", category: "dry_goods", unit: "gallon", par_level: 4, max_level: 8, current_stock: 3, unit_cost: 22.00, preferred_vendor: "US Foods", shelf_life_days: 180, storage_location: "dry storage" },
    { name: "Canola Oil", category: "dry_goods", unit: "gallon", par_level: 6, max_level: 12, current_stock: 8, unit_cost: 10.00, preferred_vendor: "Sysco Foods", shelf_life_days: 365, storage_location: "dry storage" },
    { name: "Salt (Kosher)", category: "dry_goods", unit: "box", par_level: 4, max_level: 10, current_stock: 6, unit_cost: 3.00, preferred_vendor: "Sysco Foods", shelf_life_days: 999, storage_location: "dry storage" },
    { name: "Black Pepper", category: "dry_goods", unit: "each", par_level: 4, max_level: 8, current_stock: 5, unit_cost: 6.00, preferred_vendor: "Sysco Foods", shelf_life_days: 365, storage_location: "dry storage" },
    { name: "Sugar (Granulated)", category: "dry_goods", unit: "bag", par_level: 3, max_level: 6, current_stock: 4, unit_cost: 5.00, preferred_vendor: "Sysco Foods", shelf_life_days: 999, storage_location: "dry storage" },
    { name: "Tomato Sauce (Canned)", category: "dry_goods", unit: "case", par_level: 4, max_level: 8, current_stock: 3, unit_cost: 18.00, preferred_vendor: "Sysco Foods", shelf_life_days: 365, storage_location: "dry storage" },
    { name: "Bread Crumbs", category: "dry_goods", unit: "bag", par_level: 2, max_level: 5, current_stock: 3, unit_cost: 4.50, preferred_vendor: "Metro Bakery Supply", shelf_life_days: 90, storage_location: "dry storage" },
    // Beverages (6)
    { name: "Coca-Cola Syrup", category: "beverages", unit: "box", par_level: 4, max_level: 8, current_stock: 3, unit_cost: 55.00, preferred_vendor: "Coca-Cola Bottling", shelf_life_days: 90, storage_location: "dry storage" },
    { name: "Pepsi Syrup", category: "beverages", unit: "box", par_level: 3, max_level: 6, current_stock: 2, unit_cost: 52.00, preferred_vendor: "PepsiCo Beverages", shelf_life_days: 90, storage_location: "dry storage" },
    { name: "Orange Juice", category: "beverages", unit: "gallon", par_level: 6, max_level: 12, current_stock: 4, unit_cost: 7.00, preferred_vendor: "Sysco Foods", shelf_life_days: 7, storage_location: "walk-in" },
    { name: "Coffee Beans", category: "beverages", unit: "bag", par_level: 6, max_level: 12, current_stock: 5, unit_cost: 15.00, preferred_vendor: "US Foods", shelf_life_days: 60, storage_location: "dry storage" },
    { name: "Iced Tea Mix", category: "beverages", unit: "bag", par_level: 4, max_level: 8, current_stock: 6, unit_cost: 8.00, preferred_vendor: "Sysco Foods", shelf_life_days: 180, storage_location: "dry storage" },
    { name: "Bottled Water", category: "beverages", unit: "case", par_level: 10, max_level: 20, current_stock: 8, unit_cost: 6.00, preferred_vendor: "Sysco Foods", shelf_life_days: 365, storage_location: "dry storage" },
    // Supplies (8)
    { name: "To-Go Containers (Large)", category: "supplies", unit: "case", par_level: 4, max_level: 10, current_stock: 3, unit_cost: 35.00, preferred_vendor: "Pacific Paper Co", shelf_life_days: null, storage_location: "dry storage" },
    { name: "To-Go Containers (Small)", category: "supplies", unit: "case", par_level: 4, max_level: 10, current_stock: 5, unit_cost: 28.00, preferred_vendor: "Pacific Paper Co", shelf_life_days: null, storage_location: "dry storage" },
    { name: "Paper Napkins", category: "supplies", unit: "case", par_level: 3, max_level: 8, current_stock: 4, unit_cost: 22.00, preferred_vendor: "Pacific Paper Co", shelf_life_days: null, storage_location: "dry storage" },
    { name: "Plastic Wrap", category: "supplies", unit: "each", par_level: 4, max_level: 8, current_stock: 3, unit_cost: 12.00, preferred_vendor: "Sysco Foods", shelf_life_days: null, storage_location: "dry storage" },
    { name: "Aluminum Foil", category: "supplies", unit: "each", par_level: 4, max_level: 8, current_stock: 5, unit_cost: 14.00, preferred_vendor: "Sysco Foods", shelf_life_days: null, storage_location: "dry storage" },
    { name: "Disposable Gloves (L)", category: "supplies", unit: "case", par_level: 4, max_level: 8, current_stock: 2, unit_cost: 18.00, preferred_vendor: "CleanPro Solutions", shelf_life_days: null, storage_location: "dry storage" },
    // Cleaning (5)
    { name: "Sanitizer Solution", category: "supplies", unit: "gallon", par_level: 4, max_level: 8, current_stock: 3, unit_cost: 15.00, preferred_vendor: "CleanPro Solutions", shelf_life_days: null, storage_location: "dry storage" },
    { name: "Degreaser", category: "supplies", unit: "gallon", par_level: 3, max_level: 6, current_stock: 2, unit_cost: 18.00, preferred_vendor: "CleanPro Solutions", shelf_life_days: null, storage_location: "dry storage" },
  ];

  const inventoryRows = inventoryData.map((item) => ({
    location_id: locationId,
    name: item.name,
    category: item.category,
    unit: item.unit,
    par_level: item.par_level,
    max_level: item.max_level,
    current_stock: item.current_stock,
    unit_cost: item.unit_cost,
    preferred_vendor_id: vendorMap[item.preferred_vendor] || null,
    shelf_life_days: item.shelf_life_days,
    storage_location: item.storage_location,
    reorder_lead_days: 2,
    last_counted_at: new Date().toISOString(),
  }));

  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .upsert(inventoryRows, { onConflict: "id" })
    .select("id, name");

  // ═══ 5 INVOICES ═══
  const invoiceData = [
    { vendor: "Sysco Foods", invoice_number: "INV-2026-0401", invoice_date: "2026-03-28", due_date: "2026-04-28", subtotal: 1245.50, tax: 99.64, total: 1345.14, status: "pending" },
    { vendor: "Fresh Valley Produce", invoice_number: "FVP-8821", invoice_date: "2026-03-25", due_date: "2026-03-25", subtotal: 487.00, tax: 38.96, total: 525.96, status: "paid" },
    { vendor: "US Foods", invoice_number: "USF-33021", invoice_date: "2026-03-30", due_date: "2026-04-30", subtotal: 892.75, tax: 71.42, total: 964.17, status: "approved" },
    { vendor: "Coca-Cola Bottling", invoice_number: "CC-12093", invoice_date: "2026-03-15", due_date: "2026-03-30", subtotal: 440.00, tax: 35.20, total: 475.20, status: "pending" },
    { vendor: "CleanPro Solutions", invoice_number: "CPS-4401", invoice_date: "2026-03-20", due_date: "2026-04-20", subtotal: 265.00, tax: 21.20, total: 286.20, status: "paid" },
  ];

  const invoiceRows = invoiceData.map((inv) => ({
    location_id: locationId,
    vendor_id: vendorMap[inv.vendor] || null,
    invoice_number: inv.invoice_number,
    invoice_date: inv.invoice_date,
    due_date: inv.due_date,
    subtotal: inv.subtotal,
    tax: inv.tax,
    total: inv.total,
    status: inv.status,
    paid_at: inv.status === "paid" ? new Date().toISOString() : null,
    approved_at: inv.status === "approved" || inv.status === "paid" ? new Date().toISOString() : null,
  }));

  const { data: invoices } = await supabase
    .from("invoices")
    .insert(invoiceRows)
    .select("id, invoice_number, vendor_id");

  // Add line items for each invoice
  if (invoices) {
    const lineItems = [
      // Sysco invoice items
      { inv: "INV-2026-0401", items: [
        { description: "Chicken Breast (40lb case)", category: "meat", quantity: 4, unit: "case", unit_price: 65.00, total_price: 260.00 },
        { description: "Ground Beef 80/20", category: "meat", quantity: 3, unit: "case", unit_price: 78.00, total_price: 234.00 },
        { description: "Cheddar Cheese (Shredded)", category: "dairy", quantity: 8, unit: "bag", unit_price: 6.75, total_price: 54.00, previous_price: 6.50, price_change_pct: 3.85 },
        { description: "All-Purpose Flour", category: "dry_goods", quantity: 3, unit: "bag", unit_price: 8.50, total_price: 25.50, previous_price: 8.00, price_change_pct: 6.25 },
        { description: "Canola Oil", category: "dry_goods", quantity: 5, unit: "gallon", unit_price: 10.80, total_price: 54.00, previous_price: 10.00, price_change_pct: 8.0 },
        { description: "White Rice (50lb)", category: "dry_goods", quantity: 4, unit: "bag", unit_price: 12.00, total_price: 48.00 },
        { description: "Pasta (Penne)", category: "dry_goods", quantity: 2, unit: "case", unit_price: 15.00, total_price: 30.00 },
      ]},
      // Fresh Valley
      { inv: "FVP-8821", items: [
        { description: "Romaine Lettuce", category: "produce", quantity: 6, unit: "case", unit_price: 25.50, total_price: 153.00, previous_price: 24.50, price_change_pct: 4.08 },
        { description: "Tomatoes (Vine-Ripe)", category: "produce", quantity: 4, unit: "case", unit_price: 30.00, total_price: 120.00, previous_price: 28.00, price_change_pct: 7.14 },
        { description: "Bell Peppers (Mixed)", category: "produce", quantity: 3, unit: "case", unit_price: 34.00, total_price: 102.00, previous_price: 32.00, price_change_pct: 6.25 },
        { description: "Avocados", category: "produce", quantity: 2, unit: "case", unit_price: 48.00, total_price: 96.00, previous_price: 45.00, price_change_pct: 6.67 },
        { description: "Fresh Herbs (Mixed)", category: "produce", quantity: 4, unit: "each", unit_price: 4.00, total_price: 16.00 },
      ]},
    ];

    for (const group of lineItems) {
      const inv = invoices.find((i) => i.invoice_number === group.inv);
      if (!inv) continue;
      await supabase.from("invoice_items").insert(
        group.items.map((item) => ({ ...item, invoice_id: inv.id }))
      );
    }
  }

  // ═══ 10 WASTE LOGS ═══
  const itemMap: Record<string, string> = {};
  if (inventoryItems) {
    for (const item of inventoryItems) itemMap[item.name] = item.id;
  }

  const wasteData = [
    { item: "Romaine Lettuce", quantity: 2, unit: "case", reason: "expired", estimated_cost: 49.00, logged_by: "Juan" },
    { item: "Chicken Breast", quantity: 1, unit: "case", reason: "spoiled", estimated_cost: 65.00, logged_by: "Maria" },
    { item: "Salmon Filets", quantity: 3, unit: "lb", reason: "expired", estimated_cost: 43.50, logged_by: "Juan" },
    { item: "Tomatoes", quantity: 1, unit: "case", reason: "damaged", estimated_cost: 28.00, logged_by: "Carlos" },
    { item: "Fresh Herbs (Mixed)", quantity: 3, unit: "each", reason: "expired", estimated_cost: 10.50, logged_by: "Maria" },
    { item: "Avocados", quantity: 4, unit: "each", reason: "overproduction", estimated_cost: 12.00, logged_by: "Juan" },
    { item: "Heavy Cream", quantity: 1, unit: "gallon", reason: "expired", estimated_cost: 8.00, logged_by: "Carlos" },
    { item: "Orange Juice", quantity: 2, unit: "gallon", reason: "spoiled", estimated_cost: 14.00, logged_by: "Maria" },
    { item: "Bell Peppers (Mixed)", quantity: 0.5, unit: "case", reason: "dropped", estimated_cost: 16.00, logged_by: "Juan" },
    { item: "Ground Beef 80/20", quantity: 5, unit: "lb", reason: "overproduction", estimated_cost: 27.85, logged_by: "Carlos" },
  ];

  await supabase.from("waste_logs").insert(
    wasteData.map((w) => ({
      location_id: locationId,
      item_id: itemMap[w.item] || null,
      quantity: w.quantity,
      unit: w.unit,
      reason: w.reason,
      estimated_cost: w.estimated_cost,
      logged_by: w.logged_by,
    }))
  );

  // ═══ 2 PURCHASE ORDERS ═══
  const po1 = await supabase
    .from("purchase_orders")
    .insert({
      location_id: locationId,
      vendor_id: vendorMap["Sysco Foods"],
      status: "draft",
      total_estimated: 456.00,
      notes: "Auto-generated: 3 items below par",
    })
    .select("id")
    .single();

  if (po1.data) {
    await supabase.from("purchase_order_items").insert([
      { po_id: po1.data.id, item_id: itemMap["Chicken Breast"] || null, quantity: 5, unit: "case", estimated_unit_cost: 65.00, estimated_total: 325.00 },
      { po_id: po1.data.id, item_id: itemMap["Pork Ribs"] || null, quantity: 2, unit: "case", estimated_unit_cost: 85.00, estimated_total: 170.00 },
    ]);
  }

  const po2 = await supabase
    .from("purchase_orders")
    .insert({
      location_id: locationId,
      vendor_id: vendorMap["Fresh Valley Produce"],
      status: "submitted",
      total_estimated: 310.00,
      notes: "Weekly produce order",
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (po2.data) {
    await supabase.from("purchase_order_items").insert([
      { po_id: po2.data.id, item_id: itemMap["Romaine Lettuce"] || null, quantity: 6, unit: "case", estimated_unit_cost: 24.50, estimated_total: 147.00 },
      { po_id: po2.data.id, item_id: itemMap["Tomatoes"] || null, quantity: 4, unit: "case", estimated_unit_cost: 28.00, estimated_total: 112.00 },
      { po_id: po2.data.id, item_id: itemMap["Avocados"] || null, quantity: 2, unit: "case", estimated_unit_cost: 45.00, estimated_total: 90.00 },
    ]);
  }

  // Record some price history
  const priceHistoryData = [
    { vendor: "Sysco Foods", item: "Chicken Breast (40lb case)", price: 62.00, unit: "case" },
    { vendor: "Sysco Foods", item: "Ground Beef 80/20", price: 75.00, unit: "case" },
    { vendor: "Sysco Foods", item: "Cheddar Cheese (Shredded)", price: 6.50, unit: "bag" },
    { vendor: "Sysco Foods", item: "All-Purpose Flour", price: 8.00, unit: "bag" },
    { vendor: "Sysco Foods", item: "Canola Oil", price: 10.00, unit: "gallon" },
    { vendor: "Fresh Valley Produce", item: "Romaine Lettuce", price: 24.50, unit: "case" },
    { vendor: "Fresh Valley Produce", item: "Tomatoes (Vine-Ripe)", price: 28.00, unit: "case" },
    { vendor: "Fresh Valley Produce", item: "Bell Peppers (Mixed)", price: 32.00, unit: "case" },
    { vendor: "Fresh Valley Produce", item: "Avocados", price: 45.00, unit: "case" },
    { vendor: "Coca-Cola Bottling", item: "Coca-Cola Syrup", price: 52.00, unit: "box" },
  ];

  await supabase.from("vendor_price_history").insert(
    priceHistoryData.map((p) => ({
      vendor_id: vendorMap[p.vendor] || null,
      item_description: p.item,
      unit_price: p.price,
      unit: p.unit,
      recorded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }))
  );

  return NextResponse.json({
    success: true,
    seeded: {
      vendors: vendors?.length || 0,
      inventory_items: inventoryItems?.length || 0,
      invoices: invoices?.length || 0,
      waste_logs: wasteData.length,
      purchase_orders: 2,
      price_history: priceHistoryData.length,
    },
  });
}
