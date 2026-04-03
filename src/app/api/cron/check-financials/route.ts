import { NextResponse } from "next/server";
import { accountantAgent } from "@/agents/accountant";

export async function GET() {
  try {
    const events = await accountantAgent.check();
    return NextResponse.json({ ok: true, events_logged: events.length, agent: "accountant" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
