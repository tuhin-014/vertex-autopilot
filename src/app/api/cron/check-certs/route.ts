import { NextResponse } from "next/server";
import { FoodSafetyAgent } from "@/agents/food-safety";

// Vercel Cron: daily at 7 AM EST (12:00 UTC)
// Add to vercel.json: { "path": "/api/cron/check-certs", "schedule": "0 12 * * *" }

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new FoodSafetyAgent();
    const events = await agent.checkCertifications();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        certs_flagged: events.length,
        expired: events.filter((e) => e.event_type === "cert_expired").length,
        expiring_soon: events.filter((e) => e.event_type === "cert_expiring").length,
      },
      events,
    });
  } catch (err) {
    console.error("check-certs cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
