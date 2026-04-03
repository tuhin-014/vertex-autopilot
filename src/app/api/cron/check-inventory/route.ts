import { NextResponse } from "next/server";
import { InventoryAgent } from "@/agents/inventory";

// Vercel Cron: every 6 hours
// Add to vercel.json: { "path": "/api/cron/check-inventory", "schedule": "0 */6 * * *" }

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new InventoryAgent();
    const events = await agent.check();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        below_par: events.filter((e) => e.event_type === "below_par").length,
        expiring: events.filter((e) => e.event_type === "expiring_item").length,
        pos_generated: events.filter((e) => e.event_type === "po_generated").length,
        total_events: events.length,
      },
    });
  } catch (err) {
    console.error("check-inventory cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
