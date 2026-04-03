// Sprint 5 seed script — run with: node seed-sprint5.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://iatdvwzenpjrwwotlewg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhdGR2d3plbnBqcnd3b3RsZXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDcxMTkwNiwiZXhwIjoyMDkwMjg3OTA2fQ.pC8Xw6CJ9wbuKisWSZFJ1-Rc6fulh5wxAtWfcg_FjQg'
);

async function seed() {
  const { data: locs } = await supabase.from('locations').select('id').limit(1);
  const locationId = locs?.[0]?.id;
  if (!locationId) { console.log('No locations found'); return; }
  console.log('Location ID:', locationId);

  // Check if already seeded
  const { data: existing } = await supabase.from('vendors').select('id').limit(1);
  if (existing && existing.length > 0) {
    console.log('Already seeded. Skipping vendor insert.');
  } else {
    const vendors = [
      { name: 'Sysco Foods', contact_name: 'Mike Johnson', contact_email: 'mike@sysco.com', contact_phone: '555-0101', category: 'food', payment_terms: 'net30', account_number: 'SYS-40291' },
      { name: 'US Foods', contact_name: 'Sarah Chen', contact_email: 'sarah@usfoods.com', contact_phone: '555-0102', category: 'food', payment_terms: 'net30', account_number: 'USF-8821' },
      { name: 'Coca-Cola Bottling', contact_name: 'James Rivera', contact_email: 'james@coca-cola.com', contact_phone: '555-0103', category: 'beverage', payment_terms: 'net15', account_number: 'CC-1192' },
      { name: 'PepsiCo Beverages', contact_name: 'Lisa Park', contact_email: 'lisa@pepsico.com', contact_phone: '555-0104', category: 'beverage', payment_terms: 'net15', account_number: 'PEP-3304' },
      { name: 'Fresh Valley Produce', contact_name: 'Carlos Mendez', contact_email: 'carlos@freshvalley.com', contact_phone: '555-0105', category: 'food', payment_terms: 'cod', account_number: 'FVP-112' },
      { name: 'Metro Bakery Supply', contact_name: 'Anna Kim', contact_email: 'anna@metrobakery.com', contact_phone: '555-0106', category: 'food', payment_terms: 'net15', account_number: 'MBS-770' },
      { name: 'CleanPro Solutions', contact_name: 'Dave Wilson', contact_email: 'dave@cleanpro.com', contact_phone: '555-0107', category: 'cleaning', payment_terms: 'net30', account_number: 'CPS-221' },
      { name: 'Pacific Paper Co', contact_name: 'Wei Zhang', contact_email: 'wei@pacificpaper.com', contact_phone: '555-0108', category: 'supplies', payment_terms: 'net30', account_number: 'PPC-456' },
      { name: 'Restaurant Equipment Direct', contact_name: 'Tom Brady', contact_email: 'tom@reqdirect.com', contact_phone: '555-0109', category: 'equipment', payment_terms: 'net30', account_number: 'RED-890' },
      { name: 'Local Dairy Farm', contact_name: 'Maria Santos', contact_email: 'maria@localdairy.com', contact_phone: '555-0110', category: 'food', payment_terms: 'cod', account_number: 'LDF-033' },
    ];
    const { data: vResult } = await supabase.from('vendors').insert(vendors.map(v => ({ ...v, location_id: locationId }))).select('id, name');
    console.log('Vendors seeded:', vResult?.length);
    // Build vendor map
    const vm = {}; for (const v of vResult || []) vm[v.name] = v.id;

    // Inventory items
    const invItems = [
      { name: 'Romaine Lettuce', category: 'produce', unit: 'case', par_level: 8, max_level: 15, current_stock: 6, unit_cost: 24.50, pv: 'Fresh Valley Produce', sld: 5, sl: 'walk-in' },
      { name: 'Tomatoes', category: 'produce', unit: 'case', par_level: 6, max_level: 12, current_stock: 3, unit_cost: 28.00, pv: 'Fresh Valley Produce', sld: 7, sl: 'walk-in' },
      { name: 'Onions (Yellow)', category: 'produce', unit: 'bag', par_level: 4, max_level: 8, current_stock: 5, unit_cost: 12.00, pv: 'Fresh Valley Produce', sld: 21, sl: 'dry storage' },
      { name: 'Potatoes (Russet)', category: 'produce', unit: 'bag', par_level: 6, max_level: 10, current_stock: 7, unit_cost: 15.00, pv: 'Sysco Foods', sld: 30, sl: 'dry storage' },
      { name: 'Bell Peppers (Mixed)', category: 'produce', unit: 'case', par_level: 4, max_level: 8, current_stock: 2, unit_cost: 32.00, pv: 'Fresh Valley Produce', sld: 7, sl: 'walk-in' },
      { name: 'Avocados', category: 'produce', unit: 'case', par_level: 3, max_level: 6, current_stock: 1, unit_cost: 45.00, pv: 'Fresh Valley Produce', sld: 4, sl: 'walk-in' },
      { name: 'Lemons', category: 'produce', unit: 'case', par_level: 2, max_level: 4, current_stock: 3, unit_cost: 22.00, pv: 'Fresh Valley Produce', sld: 14, sl: 'walk-in' },
      { name: 'Fresh Herbs (Mixed)', category: 'produce', unit: 'each', par_level: 10, max_level: 20, current_stock: 4, unit_cost: 3.50, pv: 'Fresh Valley Produce', sld: 3, sl: 'walk-in' },
      { name: 'Chicken Breast', category: 'meat', unit: 'case', par_level: 10, max_level: 18, current_stock: 5, unit_cost: 65.00, pv: 'Sysco Foods', sld: 3, sl: 'walk-in' },
      { name: 'Ground Beef 80/20', category: 'meat', unit: 'case', par_level: 8, max_level: 14, current_stock: 9, unit_cost: 78.00, pv: 'Sysco Foods', sld: 3, sl: 'walk-in' },
      { name: 'Bacon (Thick Cut)', category: 'meat', unit: 'case', par_level: 4, max_level: 8, current_stock: 3, unit_cost: 52.00, pv: 'US Foods', sld: 7, sl: 'walk-in' },
      { name: 'Salmon Filets', category: 'meat', unit: 'lb', par_level: 15, max_level: 25, current_stock: 8, unit_cost: 14.50, pv: 'US Foods', sld: 2, sl: 'walk-in' },
      { name: 'Shrimp (16/20)', category: 'meat', unit: 'lb', par_level: 10, max_level: 20, current_stock: 12, unit_cost: 12.00, pv: 'Sysco Foods', sld: 2, sl: 'freezer' },
      { name: 'Pork Ribs', category: 'meat', unit: 'case', par_level: 4, max_level: 8, current_stock: 2, unit_cost: 85.00, pv: 'Sysco Foods', sld: 3, sl: 'walk-in' },
      { name: 'Turkey Breast (Deli)', category: 'meat', unit: 'lb', par_level: 8, max_level: 15, current_stock: 10, unit_cost: 8.50, pv: 'US Foods', sld: 5, sl: 'walk-in' },
      { name: 'Whole Milk', category: 'dairy', unit: 'gallon', par_level: 10, max_level: 20, current_stock: 7, unit_cost: 4.50, pv: 'Local Dairy Farm', sld: 7, sl: 'walk-in' },
      { name: 'Heavy Cream', category: 'dairy', unit: 'gallon', par_level: 4, max_level: 8, current_stock: 2, unit_cost: 8.00, pv: 'Local Dairy Farm', sld: 7, sl: 'walk-in' },
      { name: 'Cheddar Cheese (Shredded)', category: 'dairy', unit: 'bag', par_level: 8, max_level: 15, current_stock: 6, unit_cost: 6.50, pv: 'Sysco Foods', sld: 14, sl: 'walk-in' },
      { name: 'Mozzarella Cheese', category: 'dairy', unit: 'lb', par_level: 12, max_level: 20, current_stock: 14, unit_cost: 5.00, pv: 'Sysco Foods', sld: 14, sl: 'walk-in' },
      { name: 'Butter (Unsalted)', category: 'dairy', unit: 'lb', par_level: 10, max_level: 20, current_stock: 8, unit_cost: 4.00, pv: 'Local Dairy Farm', sld: 30, sl: 'walk-in' },
      { name: 'Eggs (Large)', category: 'dairy', unit: 'case', par_level: 6, max_level: 10, current_stock: 4, unit_cost: 18.00, pv: 'Local Dairy Farm', sld: 21, sl: 'walk-in' },
      { name: 'All-Purpose Flour', category: 'dry_goods', unit: 'bag', par_level: 4, max_level: 8, current_stock: 5, unit_cost: 8.00, pv: 'Sysco Foods', sld: 180, sl: 'dry storage' },
      { name: 'White Rice', category: 'dry_goods', unit: 'bag', par_level: 4, max_level: 8, current_stock: 6, unit_cost: 12.00, pv: 'Sysco Foods', sld: 365, sl: 'dry storage' },
      { name: 'Pasta (Penne)', category: 'dry_goods', unit: 'case', par_level: 3, max_level: 6, current_stock: 4, unit_cost: 15.00, pv: 'Sysco Foods', sld: 365, sl: 'dry storage' },
      { name: 'Olive Oil (Extra Virgin)', category: 'dry_goods', unit: 'gallon', par_level: 4, max_level: 8, current_stock: 3, unit_cost: 22.00, pv: 'US Foods', sld: 180, sl: 'dry storage' },
      { name: 'Canola Oil', category: 'dry_goods', unit: 'gallon', par_level: 6, max_level: 12, current_stock: 8, unit_cost: 10.00, pv: 'Sysco Foods', sld: 365, sl: 'dry storage' },
      { name: 'Salt (Kosher)', category: 'dry_goods', unit: 'box', par_level: 4, max_level: 10, current_stock: 6, unit_cost: 3.00, pv: 'Sysco Foods', sld: 999, sl: 'dry storage' },
      { name: 'Black Pepper', category: 'dry_goods', unit: 'each', par_level: 4, max_level: 8, current_stock: 5, unit_cost: 6.00, pv: 'Sysco Foods', sld: 365, sl: 'dry storage' },
      { name: 'Sugar (Granulated)', category: 'dry_goods', unit: 'bag', par_level: 3, max_level: 6, current_stock: 4, unit_cost: 5.00, pv: 'Sysco Foods', sld: 999, sl: 'dry storage' },
      { name: 'Tomato Sauce (Canned)', category: 'dry_goods', unit: 'case', par_level: 4, max_level: 8, current_stock: 3, unit_cost: 18.00, pv: 'Sysco Foods', sld: 365, sl: 'dry storage' },
      { name: 'Bread Crumbs', category: 'dry_goods', unit: 'bag', par_level: 2, max_level: 5, current_stock: 3, unit_cost: 4.50, pv: 'Metro Bakery Supply', sld: 90, sl: 'dry storage' },
      { name: 'Coca-Cola Syrup', category: 'beverages', unit: 'box', par_level: 4, max_level: 8, current_stock: 3, unit_cost: 55.00, pv: 'Coca-Cola Bottling', sld: 90, sl: 'dry storage' },
      { name: 'Pepsi Syrup', category: 'beverages', unit: 'box', par_level: 3, max_level: 6, current_stock: 2, unit_cost: 52.00, pv: 'PepsiCo Beverages', sld: 90, sl: 'dry storage' },
      { name: 'Orange Juice', category: 'beverages', unit: 'gallon', par_level: 6, max_level: 12, current_stock: 4, unit_cost: 7.00, pv: 'Sysco Foods', sld: 7, sl: 'walk-in' },
      { name: 'Coffee Beans', category: 'beverages', unit: 'bag', par_level: 6, max_level: 12, current_stock: 5, unit_cost: 15.00, pv: 'US Foods', sld: 60, sl: 'dry storage' },
      { name: 'Iced Tea Mix', category: 'beverages', unit: 'bag', par_level: 4, max_level: 8, current_stock: 6, unit_cost: 8.00, pv: 'Sysco Foods', sld: 180, sl: 'dry storage' },
      { name: 'Bottled Water', category: 'beverages', unit: 'case', par_level: 10, max_level: 20, current_stock: 8, unit_cost: 6.00, pv: 'Sysco Foods', sld: 365, sl: 'dry storage' },
      { name: 'To-Go Containers (Large)', category: 'supplies', unit: 'case', par_level: 4, max_level: 10, current_stock: 3, unit_cost: 35.00, pv: 'Pacific Paper Co', sld: null, sl: 'dry storage' },
      { name: 'To-Go Containers (Small)', category: 'supplies', unit: 'case', par_level: 4, max_level: 10, current_stock: 5, unit_cost: 28.00, pv: 'Pacific Paper Co', sld: null, sl: 'dry storage' },
      { name: 'Paper Napkins', category: 'supplies', unit: 'case', par_level: 3, max_level: 8, current_stock: 4, unit_cost: 22.00, pv: 'Pacific Paper Co', sld: null, sl: 'dry storage' },
      { name: 'Plastic Wrap', category: 'supplies', unit: 'each', par_level: 4, max_level: 8, current_stock: 3, unit_cost: 12.00, pv: 'Sysco Foods', sld: null, sl: 'dry storage' },
      { name: 'Aluminum Foil', category: 'supplies', unit: 'each', par_level: 4, max_level: 8, current_stock: 5, unit_cost: 14.00, pv: 'Sysco Foods', sld: null, sl: 'dry storage' },
      { name: 'Disposable Gloves (L)', category: 'supplies', unit: 'case', par_level: 4, max_level: 8, current_stock: 2, unit_cost: 18.00, pv: 'CleanPro Solutions', sld: null, sl: 'dry storage' },
      { name: 'Sanitizer Solution', category: 'supplies', unit: 'gallon', par_level: 4, max_level: 8, current_stock: 3, unit_cost: 15.00, pv: 'CleanPro Solutions', sld: null, sl: 'dry storage' },
      { name: 'Degreaser', category: 'supplies', unit: 'gallon', par_level: 3, max_level: 6, current_stock: 2, unit_cost: 18.00, pv: 'CleanPro Solutions', sld: null, sl: 'dry storage' },
    ];

    const invRows = invItems.map(i => ({
      location_id: locationId, name: i.name, category: i.category, unit: i.unit,
      par_level: i.par_level, max_level: i.max_level, current_stock: i.current_stock,
      unit_cost: i.unit_cost, preferred_vendor_id: vm[i.pv] || null,
      shelf_life_days: i.sld, storage_location: i.sl,
      reorder_lead_days: 2, last_counted_at: new Date().toISOString()
    }));
    const { data: items } = await supabase.from('inventory_items').insert(invRows).select('id, name');
    console.log('Inventory items seeded:', items?.length);
    const im = {}; for (const i of items || []) im[i.name] = i.id;

    // 5 Invoices
    const invData = [
      { vendor: 'Sysco Foods', inv_num: 'INV-2026-0401', inv_date: '2026-03-28', due_date: '2026-04-28', sub: 1245.50, tax: 99.64, total: 1345.14, status: 'pending' },
      { vendor: 'Fresh Valley Produce', inv_num: 'FVP-8821', inv_date: '2026-03-25', due_date: '2026-03-25', sub: 487.00, tax: 38.96, total: 525.96, status: 'paid' },
      { vendor: 'US Foods', inv_num: 'USF-33021', inv_date: '2026-03-30', due_date: '2026-04-30', sub: 892.75, tax: 71.42, total: 964.17, status: 'approved' },
      { vendor: 'Coca-Cola Bottling', inv_num: 'CC-12093', inv_date: '2026-03-15', due_date: '2026-03-30', sub: 440.00, tax: 35.20, total: 475.20, status: 'pending' },
      { vendor: 'CleanPro Solutions', inv_num: 'CPS-4401', inv_date: '2026-03-20', due_date: '2026-04-20', sub: 265.00, tax: 21.20, total: 286.20, status: 'paid' },
    ];
    const { data: invoices } = await supabase.from('invoices').insert(invData.map(i => ({
      location_id: locationId, vendor_id: vm[i.vendor], invoice_number: i.inv_num,
      invoice_date: i.inv_date, due_date: i.due_date, subtotal: i.sub, tax: i.tax,
      total: i.total, status: i.status,
      paid_at: i.status === 'paid' ? new Date().toISOString() : null,
      approved_at: (i.status === 'approved' || i.status === 'paid') ? new Date().toISOString() : null,
    }))).select('id, invoice_number');
    console.log('Invoices seeded:', invoices?.length);

    // Line items for first 2 invoices
    const inv1 = invoices?.find(i => i.invoice_number === 'INV-2026-0401');
    const inv2 = invoices?.find(i => i.invoice_number === 'FVP-8821');
    if (inv1) {
      await supabase.from('invoice_items').insert([
        { invoice_id: inv1.id, description: 'Chicken Breast (40lb case)', category: 'meat', quantity: 4, unit: 'case', unit_price: 65.00, total_price: 260.00 },
        { invoice_id: inv1.id, description: 'Ground Beef 80/20', category: 'meat', quantity: 3, unit: 'case', unit_price: 78.00, total_price: 234.00 },
        { invoice_id: inv1.id, description: 'All-Purpose Flour', category: 'dry_goods', quantity: 3, unit: 'bag', unit_price: 8.50, total_price: 25.50, previous_price: 8.00, price_change_pct: 6.25 },
        { invoice_id: inv1.id, description: 'Canola Oil', category: 'dry_goods', quantity: 5, unit: 'gallon', unit_price: 10.80, total_price: 54.00, previous_price: 10.00, price_change_pct: 8.0 },
      ]);
    }
    if (inv2) {
      await supabase.from('invoice_items').insert([
        { invoice_id: inv2.id, description: 'Romaine Lettuce', category: 'produce', quantity: 6, unit: 'case', unit_price: 25.50, total_price: 153.00, previous_price: 24.50, price_change_pct: 4.08 },
        { invoice_id: inv2.id, description: 'Tomatoes (Vine-Ripe)', category: 'produce', quantity: 4, unit: 'case', unit_price: 30.00, total_price: 120.00, previous_price: 28.00, price_change_pct: 7.14 },
        { invoice_id: inv2.id, description: 'Bell Peppers (Mixed)', category: 'produce', quantity: 3, unit: 'case', unit_price: 34.00, total_price: 102.00, previous_price: 32.00, price_change_pct: 6.25 },
        { invoice_id: inv2.id, description: 'Avocados', category: 'produce', quantity: 2, unit: 'case', unit_price: 48.00, total_price: 96.00, previous_price: 45.00, price_change_pct: 6.67 },
      ]);
    }

    // 10 Waste logs
    const wasteData = [
      { item: 'Romaine Lettuce', qty: 2, unit: 'case', reason: 'expired', cost: 49.00, by: 'Juan' },
      { item: 'Chicken Breast', qty: 1, unit: 'case', reason: 'spoiled', cost: 65.00, by: 'Maria' },
      { item: 'Salmon Filets', qty: 3, unit: 'lb', reason: 'expired', cost: 43.50, by: 'Juan' },
      { item: 'Tomatoes', qty: 1, unit: 'case', reason: 'damaged', cost: 28.00, by: 'Carlos' },
      { item: 'Fresh Herbs (Mixed)', qty: 3, unit: 'each', reason: 'expired', cost: 10.50, by: 'Maria' },
      { item: 'Avocados', qty: 4, unit: 'each', reason: 'overproduction', cost: 12.00, by: 'Juan' },
      { item: 'Heavy Cream', qty: 1, unit: 'gallon', reason: 'expired', cost: 8.00, by: 'Carlos' },
      { item: 'Orange Juice', qty: 2, unit: 'gallon', reason: 'spoiled', cost: 14.00, by: 'Maria' },
      { item: 'Bell Peppers (Mixed)', qty: 0.5, unit: 'case', reason: 'dropped', cost: 16.00, by: 'Juan' },
      { item: 'Ground Beef 80/20', qty: 5, unit: 'lb', reason: 'overproduction', cost: 27.85, by: 'Carlos' },
    ];
    await supabase.from('waste_logs').insert(wasteData.map(w => ({
      location_id: locationId, item_id: im[w.item] || null,
      quantity: w.qty, unit: w.unit, reason: w.reason,
      estimated_cost: w.cost, logged_by: w.by,
    })));
    console.log('Waste logs seeded: 10');

    // 2 POs
    const { data: po1 } = await supabase.from('purchase_orders').insert({
      location_id: locationId, vendor_id: vm['Sysco Foods'], status: 'draft',
      total_estimated: 495.00, notes: 'Auto-generated: 3 items below par'
    }).select('id').single();
    if (po1) {
      await supabase.from('purchase_order_items').insert([
        { po_id: po1.id, item_id: im['Chicken Breast'], quantity: 5, unit: 'case', estimated_unit_cost: 65.00, estimated_total: 325.00 },
        { po_id: po1.id, item_id: im['Pork Ribs'], quantity: 2, unit: 'case', estimated_unit_cost: 85.00, estimated_total: 170.00 },
      ]);
    }
    const { data: po2 } = await supabase.from('purchase_orders').insert({
      location_id: locationId, vendor_id: vm['Fresh Valley Produce'], status: 'submitted',
      total_estimated: 349.00, notes: 'Weekly produce order', submitted_at: new Date().toISOString()
    }).select('id').single();
    if (po2) {
      await supabase.from('purchase_order_items').insert([
        { po_id: po2.id, item_id: im['Romaine Lettuce'], quantity: 6, unit: 'case', estimated_unit_cost: 24.50, estimated_total: 147.00 },
        { po_id: po2.id, item_id: im['Tomatoes'], quantity: 4, unit: 'case', estimated_unit_cost: 28.00, estimated_total: 112.00 },
        { po_id: po2.id, item_id: im['Avocados'], quantity: 2, unit: 'case', estimated_unit_cost: 45.00, estimated_total: 90.00 },
      ]);
    }
    console.log('Purchase orders seeded: 2');

    // Price history
    await supabase.from('vendor_price_history').insert([
      { vendor_id: vm['Sysco Foods'], item_description: 'Chicken Breast (40lb case)', unit_price: 62.00, unit: 'case' },
      { vendor_id: vm['Sysco Foods'], item_description: 'All-Purpose Flour', unit_price: 8.00, unit: 'bag' },
      { vendor_id: vm['Sysco Foods'], item_description: 'Canola Oil', unit_price: 10.00, unit: 'gallon' },
      { vendor_id: vm['Fresh Valley Produce'], item_description: 'Romaine Lettuce', unit_price: 24.50, unit: 'case' },
      { vendor_id: vm['Fresh Valley Produce'], item_description: 'Tomatoes (Vine-Ripe)', unit_price: 28.00, unit: 'case' },
      { vendor_id: vm['Fresh Valley Produce'], item_description: 'Avocados', unit_price: 45.00, unit: 'case' },
      { vendor_id: vm['Coca-Cola Bottling'], item_description: 'Coca-Cola Syrup', unit_price: 52.00, unit: 'box' },
    ].map(p => ({ ...p, recorded_at: new Date(Date.now() - 30*24*60*60*1000).toISOString() })));
    console.log('Price history seeded: 7');
  }

  console.log('\n✅ Sprint 5 seed complete!');
}

seed().catch(e => { console.error('Seed error:', e.message); process.exit(1); });
