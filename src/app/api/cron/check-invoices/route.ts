import { NextResponse } from "next/server";
import { InvoiceAgent } from "@/agents/invoice";

// Vercel Cron: daily at 9 AM EST
// Add to vercel.json: { "path": "/api/cron/check-invoices", "schedule": "0 14 * * *" }

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agent = new InvoiceAgent();
    const events = await agent.check();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        overdue_invoices: events.filter((e) => e.event_type === "invoice_overdue").length,
        price_anomalies: events.filter((e) => e.event_type === "price_increase").length,
        total_events: events.length,
      },
    });
  } catch (err) {
    console.error("check-invoices cron error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
