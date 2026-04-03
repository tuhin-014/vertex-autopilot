import { NextResponse } from "next/server";
import { OrderAgent } from "@/agents/order";

// Runs every 15 minutes
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new OrderAgent();
    const events = await agent.check();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        stale_orders: events.filter((e) => e.event_type === "stale_order").length,
        total_events: events.length,
      },
    });
  } catch (err) {
    console.error("check-orders cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
