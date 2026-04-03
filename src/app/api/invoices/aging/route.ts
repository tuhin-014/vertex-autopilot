import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/invoices/aging — Outstanding invoices by age
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");

    let query = supabase
      .from("invoices")
      .select("*, vendors(name)")
      .in("status", ["pending", "approved"])
      .order("due_date", { ascending: true });

    if (locationId) query = query.eq("location_id", locationId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const now = Date.now();
    const buckets = {
      current: [] as typeof data,
      over_30: [] as typeof data,
      over_60: [] as typeof data,
      over_90: [] as typeof data,
    };

    for (const inv of data || []) {
      if (!inv.due_date) {
        buckets.current.push(inv);
        continue;
      }
      const daysOverdue = Math.ceil((now - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue > 90) buckets.over_90.push(inv);
      else if (daysOverdue > 60) buckets.over_60.push(inv);
      else if (daysOverdue > 30) buckets.over_30.push(inv);
      else buckets.current.push(inv);
    }

    const totals = {
      current: buckets.current.reduce((s, i) => s + Number(i.total || 0), 0),
      over_30: buckets.over_30.reduce((s, i) => s + Number(i.total || 0), 0),
      over_60: buckets.over_60.reduce((s, i) => s + Number(i.total || 0), 0),
      over_90: buckets.over_90.reduce((s, i) => s + Number(i.total || 0), 0),
    };

    return NextResponse.json({ buckets, totals, total_outstanding: Object.values(totals).reduce((a, b) => a + b, 0) });
  } catch (err) {
    console.error("GET /api/invoices/aging error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
