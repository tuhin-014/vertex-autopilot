import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/inventory/alerts — Below-par items + expiring items
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");

    // Below-par items
    let parQuery = supabase
      .from("inventory_items")
      .select("*, vendors:preferred_vendor_id(name)")
      .not("par_level", "is", null);

    if (locationId) parQuery = parQuery.eq("location_id", locationId);

    const { data: allItems } = await parQuery;

    const belowPar = (allItems || [])
      .filter((item) => Number(item.current_stock) < Number(item.par_level))
      .map((item) => ({
        ...item,
        deficit: Number(item.par_level) - Number(item.current_stock),
        pct_of_par: Math.round((Number(item.current_stock) / Number(item.par_level)) * 100),
        alert_type: "below_par",
      }))
      .sort((a, b) => a.pct_of_par - b.pct_of_par);

    // Expiring items (shelf_life_days + last_counted_at)
    const expiringItems = (allItems || [])
      .filter((item) => item.shelf_life_days && item.last_counted_at && Number(item.current_stock) > 0)
      .map((item) => {
        const countedAt = new Date(item.last_counted_at).getTime();
        const shelfLifeMs = item.shelf_life_days * 24 * 60 * 60 * 1000;
        const expiresAt = countedAt + shelfLifeMs;
        const daysLeft = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
        return { ...item, days_until_expiry: daysLeft, alert_type: "expiring" };
      })
      .filter((item) => item.days_until_expiry <= 3)
      .sort((a, b) => a.days_until_expiry - b.days_until_expiry);

    return NextResponse.json({
      below_par: belowPar,
      expiring: expiringItems,
      total_alerts: belowPar.length + expiringItems.length,
    });
  } catch (err) {
    console.error("GET /api/inventory/alerts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
