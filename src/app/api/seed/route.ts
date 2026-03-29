import { NextResponse } from "next/server";
import { seed } from "@/lib/seed";

export async function POST() {
  try {
    const results = await seed();
    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET() {
  return POST();
}
