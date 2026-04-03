import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  // Get first location
  const { data: locations } = await supabase.from("locations").select("id").limit(1);
  const locationId = locations?.[0]?.id;
  if (!locationId) return NextResponse.json({ error: "No locations found — seed locations first" }, { status: 400 });

  // ═══ 30 MENU ITEMS ═══
  const menuData = [
    // Appetizers
    { name: "Crispy Calamari", category: "appetizer", price: 12.99, description: "Lightly breaded and fried to golden perfection, served with marinara", prep_time_mins: 8, popular_rank: 1, upsell_items: ["Marinara Sauce", "Ranch Dressing"] },
    { name: "Mozzarella Sticks", category: "appetizer", price: 9.99, description: "6 hand-breaded mozzarella sticks with marinara", prep_time_mins: 6, popular_rank: 2, upsell_items: ["Extra Marinara"] },
    { name: "Loaded Nachos", category: "appetizer", price: 13.99, description: "Tortilla chips, cheese, jalapeños, pico, sour cream, guac", prep_time_mins: 7, popular_rank: 3, upsell_items: ["Add Chicken +$4", "Add Beef +$5"] },
    { name: "Wings (6pc)", category: "appetizer", price: 11.99, description: "6 crispy wings — choose sauce: buffalo, BBQ, or lemon pepper", prep_time_mins: 10, popular_rank: 4, upsell_items: ["Extra Sauce", "Celery +$1"] },
    { name: "Soup of the Day", category: "appetizer", price: 6.99, description: "Ask your server for today's selection", prep_time_mins: 3, popular_rank: 5 },
    { name: "Garden Salad", category: "appetizer", price: 7.99, description: "Mixed greens, tomatoes, cucumbers, red onion, croutons", prep_time_mins: 5, popular_rank: 6, upsell_items: ["Add Grilled Chicken +$4"] },
    // Entrees
    { name: "Classic Cheeseburger", category: "entree", price: 14.99, description: "1/3 lb beef patty, American cheese, lettuce, tomato, pickles, special sauce", prep_time_mins: 12, popular_rank: 1, upsell_items: ["Bacon +$2", "Add Mushrooms +$1", "Side of Fries +$3"] },
    { name: "Grilled Chicken Sandwich", category: "entree", price: 13.99, description: "Marinated grilled chicken breast, lettuce, tomato, mayo on brioche", prep_time_mins: 12, popular_rank: 2, upsell_items: ["Add Bacon +$2", "Avocado +$2"] },
    { name: "Fish & Chips", category: "entree", price: 15.99, description: "Beer-battered cod, thick-cut fries, coleslaw, tartar sauce", prep_time_mins: 14, popular_rank: 3, upsell_items: ["Extra Tartar"] },
    { name: "Ribeye Steak", category: "entree", price: 24.99, description: "10oz ribeye, grilled to order, garlic butter, choice of two sides", prep_time_mins: 18, popular_rank: 4, upsell_items: ["Mushroom Sauce +$2", "Grilled Shrimp +$6"] },
    { name: "Chicken Alfredo", category: "entree", price: 16.99, description: "Fettuccine, creamy parmesan alfredo, grilled chicken, garlic bread", prep_time_mins: 15, popular_rank: 5, upsell_items: ["Add Shrimp +$6", "Extra Garlic Bread +$2"] },
    { name: "Fish Tacos (3)", category: "entree", price: 14.99, description: "Grilled mahi, cabbage slaw, chipotle crema, flour tortillas", prep_time_mins: 12, popular_rank: 6, upsell_items: ["Add Guac +$2", "Extra Salsa"] },
    { name: "BBQ Pulled Pork", category: "entree", price: 15.99, description: "Slow-smoked pulled pork, tangy BBQ sauce, coleslaw, Texas toast", prep_time_mins: 10, popular_rank: 7, upsell_items: ["Mac & Cheese Side +$3"] },
    { name: "Veggie Burger", category: "entree", price: 13.99, description: "House-made black bean patty, avocado, sprouts, chipotle aioli", prep_time_mins: 12, popular_rank: 8 },
    { name: "NY Strip", category: "entree", price: 22.99, description: "12oz New York strip, grilled to order, garlic butter, two sides", prep_time_mins: 18, popular_rank: 9, upsell_items: ["Peppercorn Sauce +$2"] },
    { name: "Shrimp Scampi", category: "entree", price: 18.99, description: "Linguine, 10 sautéed shrimp, garlic white wine butter, parsley", prep_time_mins: 14, popular_rank: 10, upsell_items: ["Extra Shrimp +$6"] },
    // Sides
    { name: "French Fries", category: "side", price: 4.99, description: "Crispy hand-cut fries, sea salt", prep_time_mins: 6, popular_rank: 1 },
    { name: "Onion Rings", category: "side", price: 5.99, description: "Beer-battered thick-cut onion rings", prep_time_mins: 6, popular_rank: 2 },
    { name: "Mac & Cheese", category: "side", price: 5.99, description: "Creamy 4-cheese blend, breadcrumb top", prep_time_mins: 8, popular_rank: 3, upsell_items: ["Bacon Bits +$1"] },
    { name: "Coleslaw", category: "side", price: 3.99, description: "Creamy house-made coleslaw", prep_time_mins: 2, popular_rank: 4 },
    { name: "Mashed Potatoes", category: "side", price: 4.99, description: "Creamy garlic mashed potatoes", prep_time_mins: 3, popular_rank: 5 },
    { name: "Steamed Broccoli", category: "side", price: 4.49, description: "Fresh broccoli, steamed tender", prep_time_mins: 5, popular_rank: 6 },
    // Desserts
    { name: "Chocolate Lava Cake", category: "dessert", price: 8.99, description: "Warm chocolate cake with molten center, vanilla ice cream", prep_time_mins: 12, popular_rank: 1, upsell_items: ["Extra Ice Cream +$2"] },
    { name: "New York Cheesecake", category: "dessert", price: 7.99, description: "Classic creamy cheesecake with strawberry topping", prep_time_mins: 3, popular_rank: 2 },
    { name: "Apple Pie à la Mode", category: "dessert", price: 7.49, description: "Warm spiced apple pie, vanilla ice cream", prep_time_mins: 5, popular_rank: 3 },
    { name: "Brownie Sundae", category: "dessert", price: 6.99, description: "Warm fudge brownie, vanilla ice cream, chocolate sauce", prep_time_mins: 5, popular_rank: 4 },
    // Beverages
    { name: "Soft Drink", category: "beverage", price: 2.99, description: "Coca-Cola, Diet Coke, Sprite, Fanta, Dr Pepper", prep_time_mins: 1, popular_rank: 1 },
    { name: "Fresh Lemonade", category: "beverage", price: 3.49, description: "House-made fresh-squeezed lemonade", prep_time_mins: 2, popular_rank: 2, upsell_items: ["Add Strawberry +$1"] },
    { name: "Iced Tea", category: "beverage", price: 2.99, description: "Fresh-brewed iced tea, sweetened or unsweetened", prep_time_mins: 1, popular_rank: 3 },
    { name: "Craft Beer", category: "beverage", price: 6.99, description: "Ask about our rotating craft beer selection", prep_time_mins: 1, popular_rank: 4 },
    { name: "Coffee", category: "beverage", price: 2.49, description: "Fresh brewed hot coffee", prep_time_mins: 1, popular_rank: 5 },
    // Combos
    { name: "Burger Combo", category: "combo", price: 17.99, description: "Classic Cheeseburger + Fries + Soft Drink", prep_time_mins: 12, popular_rank: 1, upsell_items: ["Upgrade to Sweet Potato Fries +$1"] },
    { name: "Wings Combo", category: "combo", price: 15.99, description: "6 Wings + Fries + Soft Drink", prep_time_mins: 10, popular_rank: 2 },
    { name: "Fish & Chips Combo", category: "combo", price: 18.99, description: "Fish & Chips + Coleslaw + Drink", prep_time_mins: 14, popular_rank: 3 },
  ];

  const { data: menuItems } = await supabase
    .from("menu_items")
    .upsert(menuData.map((m) => ({ ...m, location_id: locationId })), { onConflict: "id" })
    .select("id, name");

  // ═══ 20 SAMPLE ORDERS ═══
  const channels = ["phone", "walk_in", "online", "delivery"];
  const statuses = ["new", "preparing", "ready", "completed", "completed", "completed", "completed"];
  const employees = ["Maria", "Carlos", "Juan", "Alex", "Samantha", "AI"];

  const sampleItems = menuItems?.slice(0, 15) || [];
  const orderData = [];

  for (let i = 0; i < 20; i++) {
    const channel = channels[i % channels.length];
    const status = i < 7 ? statuses[i % statuses.length] : "completed";
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
    const items = [];
    const itemCount = Math.floor(Math.random() * 4) + 1;
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const menuItem = sampleItems[Math.floor(Math.random() * sampleItems.length)];
      if (!menuItem) continue;
      const qty = Math.floor(Math.random() * 2) + 1;
      const price = menuData.find((m) => m.name === menuItem.name)?.price || 10.99;
      items.push({ name: menuItem.name, qty, price, modifiers: [] });
      subtotal += price * qty;
    }

    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const takenBy = employees[Math.floor(Math.random() * employees.length)];

    orderData.push({
      location_id: locationId,
      channel,
      status,
      customer_name: `Customer ${i + 1}`,
      customer_phone: `555-${String(i + 1).padStart(4, "0")}`,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      items,
      special_instructions: i % 5 === 0 ? "No onions please" : null,
      estimated_prep_mins: 15,
      taken_by: takenBy,
      completed_at: status === "completed" ? createdAt : null,
      created_at: createdAt,
    });
  }

  const { data: orders } = await supabase.from("orders").insert(orderData).select("id, order_number");

  // ═══ 3 ORDER ISSUES ═══
  if (orders && orders.length >= 3) {
    const issueData = [
      {
        order_id: orders[0]?.id,
        issue_type: "wrong_item",
        description: "Ordered Classic Cheeseburger, received Veggie Burger instead",
        resolution: "remake",
        refund_amount: 0,
        reported_by: "Maria",
      },
      {
        order_id: orders[1]?.id,
        issue_type: "late",
        description: "Order took 52 minutes — customer was very upset about wait time",
        resolution: "discount",
        refund_amount: 5.00,
        reported_by: "Carlos",
      },
      {
        order_id: orders[2]?.id,
        issue_type: "missing_item",
        description: "Loaded Nachos was missing the guacamole even though it was ordered",
        resolution: "comped",
        refund_amount: 2.00,
        reported_by: "Juan",
      },
    ];

    await supabase.from("order_issues").insert(
      issueData.map((i) => ({ ...i, location_id: locationId }))
    );
  }

  // ═══ 2 CHECKLIST TEMPLATES ═══
  const openingItems = [
    { task: "Turn on all kitchen lights", requires_photo: false, category: "facility", order: 1 },
    { task: "Set HVAC to operating temperature", requires_photo: false, category: "facility", order: 2 },
    { task: "Preheat all ovens to temperature", requires_photo: false, category: "equipment", order: 3 },
    { task: "Turn on and heat fryers", requires_photo: false, category: "equipment", order: 4 },
    { task: "Open and count cash register", requires_photo: false, category: "financial", order: 5 },
    { task: "Count opening safe balance", requires_photo: true, category: "financial", order: 6 },
    { task: "Check walk-in cooler temperature (must be below 40°F)", requires_photo: true, category: "food_safety", order: 7 },
    { task: "Check freezer temperature (must be below 0°F)", requires_photo: true, category: "food_safety", order: 8 },
    { task: "Set up prep station with all necessary items", requires_photo: false, category: "food_safety", order: 9 },
    { task: "Stock handwash stations with soap and towels", requires_photo: false, category: "cleaning", order: 10 },
    { task: "Check and restock floor mats", requires_photo: false, category: "cleaning", order: 11 },
    { task: "Unlock all doors and set up entrance", requires_photo: false, category: "facility", order: 12 },
    { task: "Turn on exterior signage and menu boards", requires_photo: false, category: "facility", order: 13 },
    { task: "Turn on music and ambiance audio", requires_photo: false, category: "facility", order: 14 },
    { task: "Test POS system — run a void transaction", requires_photo: true, category: "equipment", order: 15 },
  ];

  const closingItems = [
    { task: "Lock all exterior doors", requires_photo: false, category: "security", order: 1 },
    { task: "Close and balance all registers", requires_photo: false, category: "financial", order: 2 },
    { task: "Count closing safe and record", requires_photo: true, category: "financial", order: 3 },
    { task: "Clean and sanitize all kitchen surfaces", requires_photo: false, category: "cleaning", order: 4 },
    { task: "Sanitize prep stations and cutting boards", requires_photo: false, category: "food_safety", order: 5 },
    { task: "Sweep and mop kitchen floor", requires_photo: false, category: "cleaning", order: 6 },
    { task: "Take out all trash to dumpster", requires_photo: false, category: "cleaning", order: 7 },
    { task: "Turn off and clean fryers", requires_photo: false, category: "equipment", order: 8 },
    { task: "Turn off and cool down ovens", requires_photo: false, category: "equipment", order: 9 },
    { task: "Check and log walk-in cooler temperature", requires_photo: true, category: "food_safety", order: 10 },
    { task: "Check and log freezer temperature", requires_photo: true, category: "food_safety", order: 11 },
    { task: "Wipe down all tables and chairs", requires_photo: false, category: "cleaning", order: 12 },
    { task: "Restock paper goods and supplies for morning", requires_photo: false, category: "inventory", order: 13 },
    { task: "Set alarm system and verify lock", requires_photo: true, category: "security", order: 14 },
    { task: "Take photo of clean kitchen", requires_photo: true, category: "compliance", order: 15 },
    { task: "Write handoff notes for next shift", requires_photo: false, category: "handoff", order: 16 },
    { task: "Check walk-in: any items that need attention?", requires_photo: false, category: "food_safety", order: 17 },
    { task: "Turn off all lights except night lights", requires_photo: false, category: "facility", order: 18 },
  ];

  const { data: templates } = await supabase
    .from("checklist_templates")
    .upsert(
      [
        { location_id: locationId, name: "Morning Opening Checklist", type: "opening", items: openingItems, deadline_minutes: 60 },
        { location_id: locationId, name: "Night Closing Checklist", type: "closing", items: closingItems, deadline_minutes: 90 },
      ],
      { onConflict: "id" }
    )
    .select("id, name, type");

  // ═══ 5 CHECKLIST COMPLETIONS ═══
  if (templates && templates.length > 0) {
    const openingTemplate = templates.find((t) => t.type === "opening");
    const closingTemplate = templates.find((t) => t.type === "closing");

    const completionsData = [
      // 2 completed opening checklists
      {
        template_id: openingTemplate?.id,
        shift_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        shift_type: "opening",
        status: "completed",
        completed_by: "Maria",
        completion_pct: 100,
        items_completed: openingItems.map((item, idx) => ({
          task: item.task,
          completed: true,
          completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + idx * 3 * 60000).toISOString(),
          photo_url: item.requires_photo ? `https://placeholder.co/400x300?text=${encodeURIComponent(item.task)}` : null,
          notes: null,
        })),
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60000).toISOString(),
        handoff_notes: "All stations ready. Prepped extra burger patties for expected lunch rush.",
      },
      {
        template_id: openingTemplate?.id,
        shift_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        shift_type: "opening",
        status: "completed",
        completed_by: "Carlos",
        completion_pct: 100,
        items_completed: openingItems.map((item, idx) => ({
          task: item.task,
          completed: true,
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + idx * 3 * 60000).toISOString(),
          photo_url: item.requires_photo ? `https://placeholder.co/400x300?text=${encodeURIComponent(item.task)}` : null,
          notes: null,
        })),
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 50 * 60000).toISOString(),
        handoff_notes: "Freezer was at -2°F this morning — noted. POS system tested OK.",
      },
      {
        template_id: closingTemplate?.id,
        shift_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        shift_type: "closing",
        status: "completed",
        completed_by: "Juan",
        completion_pct: 100,
        items_completed: closingItems.map((item, idx) => ({
          task: item.task,
          completed: true,
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + idx * 2 * 60000).toISOString(),
          photo_url: item.requires_photo ? `https://placeholder.co/400x300?text=${encodeURIComponent(item.task)}` : null,
          notes: null,
        })),
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60000).toISOString(),
        handoff_notes: "Big catering order tomorrow — need extra chicken breast thawed. Left 2 cases in walk-in.",
      },
      // 1 incomplete (missed some items)
      {
        template_id: closingTemplate?.id,
        shift_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        shift_type: "closing",
        status: "incomplete",
        completed_by: "Alex",
        completion_pct: 67,
        items_completed: closingItems.map((item, idx) => ({
          task: item.task,
          completed: idx < 12, // Missed items 13-18
          completed_at: idx < 12 ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + idx * 2 * 60000).toISOString() : null,
          photo_url: idx < 12 && item.requires_photo ? `https://placeholder.co/400x300?text=${encodeURIComponent(item.task)}` : null,
          notes: idx === 12 ? "Ran out of time, had to leave early" : null,
        })),
        completed_at: null,
        handoff_notes: "Missed photo of clean kitchen and alarm check — will do first thing tomorrow.",
      },
      // 1 in progress (started today)
      {
        template_id: openingTemplate?.id,
        shift_date: new Date().toISOString().split("T")[0],
        shift_type: "opening",
        status: "in_progress",
        completed_by: "Samantha",
        completion_pct: 60,
        items_completed: openingItems.map((item, idx) => ({
          task: item.task,
          completed: idx < 9,
          completed_at: idx < 9 ? new Date(Date.now() - idx * 5 * 60000).toISOString() : null,
          photo_url: null,
          notes: null,
        })),
        completed_at: null,
        handoff_notes: null,
      },
    ];

    const allCompletions = completionsData.map((c) => ({ ...c, location_id: locationId }));
    await supabase.from("checklist_completions").upsert(allCompletions, { onConflict: "id" });
  }

  return NextResponse.json({
    success: true,
    seeded: {
      menu_items: menuItems?.length || 0,
      orders: orders?.length || 0,
      order_issues: 3,
      checklist_templates: templates?.length || 0,
      checklist_completions: 5,
    },
  });
}
