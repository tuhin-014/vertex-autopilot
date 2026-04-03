import { NextResponse } from "next/server";
import { wasteAgent } from "@/agents/waste";

export async function GET() {
  try {
    const events = await wasteAgent.check();
    return NextResponse.json({ ok: true, events_logged: events.length, agent: "waste" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
