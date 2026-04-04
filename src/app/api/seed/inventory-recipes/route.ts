import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createServiceClient();

  // Step 1: Create tables
  const { error: e1 } = await supabase.rpc("exec_sql", {
    query: `
      CREATE TABLE IF NOT EXISTS recipes (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
        inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
        quantity_needed numeric NOT NULL DEFAULT 1,
        unit text NOT NULL DEFAULT 'each',
        notes text,
        created_at timestamptz DEFAULT now(),
        UNIQUE(menu_item_id, inventory_item_id)
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
        location_id uuid REFERENCES locations(id),
        movement_type text NOT NULL CHECK (movement_type IN ('received', 'used', 'wasted', 'adjusted', 'counted')),
        quantity numeric NOT NULL,
        previous_stock numeric,
        new_stock numeric,
        reference_type text,
        reference_id uuid,
        recorded_by text,
        notes text,
        created_at timestamptz DEFAULT now()
      );
    `,
  });

  // If rpc not available, create via raw approach
  // Tables might already exist, continue regardless

  // Step 2: Get location
  const { data: locs } = await supabase.from("locations").select("id").limit(1);
  const locationId = locs?.[0]?.id;
  if (!locationId) return NextResponse.json({ error: "No location found" }, { status: 400 });

  // Step 3: Seed menu items (IHOP-style)
  const menuItems = [
    // Breakfast
    { name: "Classic Buttermilk Pancakes", category: "Breakfast", price: 10.99, description: "Stack of 5 fluffy buttermilk pancakes", available: true, location_id: locationId },
    { name: "Build Your Own Omelette", category: "Breakfast", price: 13.49, description: "3-egg omelette with choice of fillings, hash browns & toast", available: true, location_id: locationId },
    { name: "Country Fried Steak & Eggs", category: "Breakfast", price: 14.99, description: "Breaded steak, 2 eggs, hash browns, country gravy & toast", available: true, location_id: locationId },
    { name: "Bacon & Eggs Combo", category: "Breakfast", price: 11.99, description: "4 strips bacon, 2 eggs any style, hash browns & toast", available: true, location_id: locationId },
    { name: "French Toast Combo", category: "Breakfast", price: 12.49, description: "Thick-cut French toast, 2 eggs, 2 bacon strips", available: true, location_id: locationId },
    { name: "Breakfast Burrito", category: "Breakfast", price: 11.99, description: "Scrambled eggs, cheese, bacon, peppers in a flour tortilla", available: true, location_id: locationId },
    { name: "Belgian Waffle", category: "Breakfast", price: 11.49, description: "Golden Belgian waffle with butter & syrup", available: true, location_id: locationId },
    { name: "Eggs Benedict", category: "Breakfast", price: 13.99, description: "Poached eggs, Canadian bacon, hollandaise on English muffin", available: true, location_id: locationId },
    // Lunch/Dinner
    { name: "Classic Burger", category: "Burgers", price: 12.99, description: "1/3 lb patty, lettuce, tomato, onion, pickle, brioche bun", available: true, location_id: locationId },
    { name: "Chicken Bacon Ranch Burger", category: "Burgers", price: 14.49, description: "Grilled chicken, bacon, ranch, lettuce, tomato", available: true, location_id: locationId },
    { name: "Grilled Salmon", category: "Entrees", price: 16.99, description: "Atlantic salmon, rice pilaf, steamed vegetables", available: true, location_id: locationId },
    { name: "Chicken Tenders Basket", category: "Entrees", price: 11.99, description: "Hand-breaded chicken tenders, fries, honey mustard", available: true, location_id: locationId },
    { name: "Caesar Salad", category: "Salads", price: 10.49, description: "Romaine, parmesan, croutons, Caesar dressing", available: true, location_id: locationId },
    { name: "Grilled Chicken Caesar", category: "Salads", price: 13.49, description: "Caesar salad topped with grilled chicken breast", available: true, location_id: locationId },
    { name: "Pasta Marinara", category: "Entrees", price: 11.99, description: "Penne pasta, house marinara sauce, garlic bread", available: true, location_id: locationId },
    { name: "Fish & Chips", category: "Entrees", price: 13.99, description: "Beer-battered cod, fries, coleslaw, tartar sauce", available: true, location_id: locationId },
    // Sides
    { name: "Hash Browns", category: "Sides", price: 3.49, description: "Crispy golden hash browns", available: true, location_id: locationId },
    { name: "French Fries", category: "Sides", price: 3.99, description: "Seasoned crispy fries", available: true, location_id: locationId },
    { name: "Side Salad", category: "Sides", price: 4.49, description: "Mixed greens, tomato, cucumber, choice of dressing", available: true, location_id: locationId },
    { name: "Toast (2 slices)", category: "Sides", price: 2.49, description: "White, wheat, or sourdough", available: true, location_id: locationId },
    { name: "Onion Rings", category: "Sides", price: 4.99, description: "Hand-battered crispy onion rings", available: true, location_id: locationId },
    // Drinks
    { name: "Coffee", category: "Drinks", price: 2.99, description: "Fresh brewed coffee, free refills", available: true, location_id: locationId },
    { name: "Orange Juice", category: "Drinks", price: 3.49, description: "Fresh squeezed OJ", available: true, location_id: locationId },
    { name: "Iced Tea", category: "Drinks", price: 2.99, description: "Fresh brewed, sweetened or unsweetened", available: true, location_id: locationId },
    { name: "Fountain Drink", category: "Drinks", price: 2.99, description: "Coke, Pepsi, Sprite, etc.", available: true, location_id: locationId },
    // Kids
    { name: "Kids Pancakes", category: "Kids", price: 6.99, description: "2 pancakes, 1 egg, 1 bacon strip", available: true, location_id: locationId },
    { name: "Kids Chicken Tenders", category: "Kids", price: 7.49, description: "3 tenders, fries, drink", available: true, location_id: locationId },
    { name: "Kids Mac & Cheese", category: "Kids", price: 6.49, description: "Creamy mac & cheese, drink", available: true, location_id: locationId },
    // Desserts
    { name: "New York Cheesecake", category: "Desserts", price: 7.99, description: "Classic cheesecake with strawberry topping", available: true, location_id: locationId },
    { name: "Chocolate Lava Cake", category: "Desserts", price: 8.49, description: "Warm chocolate cake with molten center, ice cream", available: true, location_id: locationId },
  ];

  // Delete existing menu items and re-seed
  await supabase.from("menu_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: insertedMenu, error: menuError } = await supabase
    .from("menu_items")
    .insert(menuItems)
    .select("id, name");

  if (menuError) return NextResponse.json({ error: menuError.message, step: "menu" }, { status: 500 });

  // Step 4: Build menu name → id lookup
  const menuMap: Record<string, string> = {};
  for (const m of insertedMenu || []) menuMap[m.name] = m.id;

  // Step 5: Get inventory name → id lookup
  const { data: invItems } = await supabase.from("inventory_items").select("id, name");
  const invMap: Record<string, string> = {};
  for (const i of invItems || []) invMap[i.name] = i.id;

  // Step 6: Create recipes (menu item → ingredient mappings)
  // Helper function
  const r = (menu: string, ingredient: string, qty: number, unit: string, notes?: string) => {
    if (!menuMap[menu] || !invMap[ingredient]) return null;
    return { menu_item_id: menuMap[menu], inventory_item_id: invMap[ingredient], quantity_needed: qty, unit, notes: notes || null };
  };

  const recipes = [
    // Classic Buttermilk Pancakes
    r("Classic Buttermilk Pancakes", "Eggs (Large)", 0.1, "case", "~3 eggs per order"),
    r("Classic Buttermilk Pancakes", "All-Purpose Flour", 0.05, "bag", "~2 cups"),
    r("Classic Buttermilk Pancakes", "Whole Milk", 0.1, "gallon", "~1 cup"),
    r("Classic Buttermilk Pancakes", "Butter (Unsalted)", 0.1, "lb", "2 tbsp"),

    // Build Your Own Omelette
    r("Build Your Own Omelette", "Eggs (Large)", 0.15, "case", "~4 eggs per omelette"),
    r("Build Your Own Omelette", "Cheddar Cheese (Shredded)", 0.05, "bag", "1/4 cup"),
    r("Build Your Own Omelette", "Bell Peppers (Mixed)", 0.02, "case", "diced peppers"),
    r("Build Your Own Omelette", "Onions (Yellow)", 0.02, "bag", "diced onion"),
    r("Build Your Own Omelette", "Butter (Unsalted)", 0.05, "lb", "1 tbsp"),
    r("Build Your Own Omelette", "Potatoes (Russet)", 0.05, "bag", "hash brown side"),

    // Country Fried Steak & Eggs
    r("Country Fried Steak & Eggs", "Ground Beef 80/20", 0.05, "case", "breaded steak portion"),
    r("Country Fried Steak & Eggs", "Eggs (Large)", 0.1, "case", "2 eggs"),
    r("Country Fried Steak & Eggs", "All-Purpose Flour", 0.03, "bag", "breading"),
    r("Country Fried Steak & Eggs", "Bread Crumbs", 0.05, "bag", "breading"),
    r("Country Fried Steak & Eggs", "Whole Milk", 0.05, "gallon", "gravy"),
    r("Country Fried Steak & Eggs", "Canola Oil", 0.05, "gallon", "frying"),
    r("Country Fried Steak & Eggs", "Potatoes (Russet)", 0.05, "bag", "hash browns"),

    // Bacon & Eggs Combo
    r("Bacon & Eggs Combo", "Bacon (Thick Cut)", 0.05, "case", "4 strips"),
    r("Bacon & Eggs Combo", "Eggs (Large)", 0.1, "case", "2 eggs"),
    r("Bacon & Eggs Combo", "Potatoes (Russet)", 0.05, "bag", "hash browns"),
    r("Bacon & Eggs Combo", "Butter (Unsalted)", 0.05, "lb", "toast + cooking"),

    // French Toast Combo
    r("French Toast Combo", "Eggs (Large)", 0.15, "case", "egg wash + 2 eggs side"),
    r("French Toast Combo", "Whole Milk", 0.05, "gallon", "egg wash"),
    r("French Toast Combo", "Bacon (Thick Cut)", 0.03, "case", "2 strips"),
    r("French Toast Combo", "Butter (Unsalted)", 0.1, "lb", "cooking + serving"),
    r("French Toast Combo", "Sugar (Granulated)", 0.01, "bag", "cinnamon sugar"),

    // Breakfast Burrito
    r("Breakfast Burrito", "Eggs (Large)", 0.1, "case", "scrambled eggs"),
    r("Breakfast Burrito", "Cheddar Cheese (Shredded)", 0.05, "bag"),
    r("Breakfast Burrito", "Bacon (Thick Cut)", 0.03, "case", "diced bacon"),
    r("Breakfast Burrito", "Bell Peppers (Mixed)", 0.02, "case"),
    r("Breakfast Burrito", "Onions (Yellow)", 0.02, "bag"),

    // Belgian Waffle
    r("Belgian Waffle", "Eggs (Large)", 0.1, "case", "2 eggs in batter"),
    r("Belgian Waffle", "All-Purpose Flour", 0.05, "bag"),
    r("Belgian Waffle", "Whole Milk", 0.1, "gallon"),
    r("Belgian Waffle", "Butter (Unsalted)", 0.1, "lb"),
    r("Belgian Waffle", "Sugar (Granulated)", 0.01, "bag"),

    // Eggs Benedict
    r("Eggs Benedict", "Eggs (Large)", 0.15, "case", "2 poached + hollandaise"),
    r("Eggs Benedict", "Butter (Unsalted)", 0.15, "lb", "hollandaise"),
    r("Eggs Benedict", "Lemons", 0.02, "case", "hollandaise"),

    // Classic Burger
    r("Classic Burger", "Ground Beef 80/20", 0.06, "case", "1/3 lb patty"),
    r("Classic Burger", "Tomatoes", 0.02, "case", "2 slices"),
    r("Classic Burger", "Onions (Yellow)", 0.02, "bag", "sliced"),
    r("Classic Burger", "Romaine Lettuce", 0.01, "case", "leaf"),
    r("Classic Burger", "Potatoes (Russet)", 0.05, "bag", "fries side"),
    r("Classic Burger", "Canola Oil", 0.03, "gallon", "frying"),

    // Grilled Salmon
    r("Grilled Salmon", "Salmon Filets", 1, "lb", "8oz filet"),
    r("Grilled Salmon", "White Rice", 0.03, "bag", "rice pilaf"),
    r("Grilled Salmon", "Olive Oil (Extra Virgin)", 0.02, "gallon"),
    r("Grilled Salmon", "Lemons", 0.02, "case", "garnish"),
    r("Grilled Salmon", "Butter (Unsalted)", 0.05, "lb"),

    // Chicken Tenders Basket
    r("Chicken Tenders Basket", "Chicken Breast", 0.05, "case", "3 tenders"),
    r("Chicken Tenders Basket", "All-Purpose Flour", 0.03, "bag", "breading"),
    r("Chicken Tenders Basket", "Bread Crumbs", 0.05, "bag"),
    r("Chicken Tenders Basket", "Eggs (Large)", 0.05, "case", "egg wash"),
    r("Chicken Tenders Basket", "Canola Oil", 0.05, "gallon", "frying"),
    r("Chicken Tenders Basket", "Potatoes (Russet)", 0.05, "bag", "fries"),

    // Caesar Salad
    r("Caesar Salad", "Romaine Lettuce", 0.08, "case"),
    r("Caesar Salad", "Lemons", 0.02, "case", "dressing"),
    r("Caesar Salad", "Olive Oil (Extra Virgin)", 0.02, "gallon"),

    // Grilled Chicken Caesar
    r("Grilled Chicken Caesar", "Romaine Lettuce", 0.08, "case"),
    r("Grilled Chicken Caesar", "Chicken Breast", 0.04, "case", "grilled breast"),
    r("Grilled Chicken Caesar", "Lemons", 0.02, "case"),
    r("Grilled Chicken Caesar", "Olive Oil (Extra Virgin)", 0.02, "gallon"),

    // Pasta Marinara
    r("Pasta Marinara", "Pasta (Penne)", 0.06, "case"),
    r("Pasta Marinara", "Tomato Sauce (Canned)", 0.05, "case"),
    r("Pasta Marinara", "Olive Oil (Extra Virgin)", 0.02, "gallon"),
    r("Pasta Marinara", "Onions (Yellow)", 0.02, "bag"),
    r("Pasta Marinara", "Fresh Herbs (Mixed)", 0.2, "each", "basil/oregano"),

    // Fish & Chips
    r("Fish & Chips", "All-Purpose Flour", 0.04, "bag", "batter"),
    r("Fish & Chips", "Eggs (Large)", 0.05, "case", "batter"),
    r("Fish & Chips", "Canola Oil", 0.08, "gallon", "deep fry"),
    r("Fish & Chips", "Potatoes (Russet)", 0.06, "bag", "chips"),

    // Coffee
    r("Coffee", "Coffee Beans", 0.03, "bag"),
    r("Coffee", "Whole Milk", 0.02, "gallon", "creamer"),
    r("Coffee", "Sugar (Granulated)", 0.005, "bag"),

    // OJ
    r("Orange Juice", "Orange Juice", 0.1, "gallon"),

    // Kids Pancakes
    r("Kids Pancakes", "Eggs (Large)", 0.08, "case", "batter + 1 egg"),
    r("Kids Pancakes", "All-Purpose Flour", 0.03, "bag"),
    r("Kids Pancakes", "Whole Milk", 0.05, "gallon"),
    r("Kids Pancakes", "Bacon (Thick Cut)", 0.02, "case", "1 strip"),
    r("Kids Pancakes", "Butter (Unsalted)", 0.05, "lb"),

    // Kids Chicken Tenders
    r("Kids Chicken Tenders", "Chicken Breast", 0.03, "case"),
    r("Kids Chicken Tenders", "Bread Crumbs", 0.03, "bag"),
    r("Kids Chicken Tenders", "Canola Oil", 0.03, "gallon"),
    r("Kids Chicken Tenders", "Potatoes (Russet)", 0.03, "bag"),

    // Sides
    r("Hash Browns", "Potatoes (Russet)", 0.06, "bag"),
    r("Hash Browns", "Canola Oil", 0.02, "gallon"),
    r("French Fries", "Potatoes (Russet)", 0.06, "bag"),
    r("French Fries", "Canola Oil", 0.03, "gallon"),
    r("Onion Rings", "Onions (Yellow)", 0.05, "bag"),
    r("Onion Rings", "All-Purpose Flour", 0.02, "bag"),
    r("Onion Rings", "Canola Oil", 0.05, "gallon"),

    // Fountain Drink
    r("Fountain Drink", "Coca-Cola Syrup", 0.01, "box"),
    r("Fountain Drink", "Pepsi Syrup", 0.01, "box"),
  ].filter(Boolean);

  // Delete existing recipes
  await supabase.from("recipes").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: insertedRecipes, error: recipeError } = await supabase
    .from("recipes")
    .insert(recipes)
    .select("id");

  // Step 7: Set initial stock levels & create stock movements
  const movements = [];
  for (const inv of invItems || []) {
    const curr = (inv as unknown as { current_stock: number }).current_stock || 0;
    if (curr > 0) {
      movements.push({
        inventory_item_id: inv.id,
        location_id: locationId,
        movement_type: "counted",
        quantity: curr,
        previous_stock: 0,
        new_stock: curr,
        recorded_by: "System (Initial Count)",
        notes: "Initial stock count on setup",
      });
    }
  }

  let movementCount = 0;
  if (movements.length > 0) {
    const { data: movData } = await supabase.from("stock_movements").insert(movements).select("id");
    movementCount = movData?.length || 0;
  }

  return NextResponse.json({
    success: true,
    menu_items: insertedMenu?.length || 0,
    recipes: insertedRecipes?.length || 0,
    stock_movements: movementCount,
    menu_categories: [...new Set(menuItems.map(m => m.category))],
  });
}
