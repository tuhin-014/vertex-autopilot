import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { handleTextToApply } from "@/agents/hiring";

// Twilio webhook for incoming SMS (text-to-apply)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;

    if (!from || !body) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Invalid request</Message></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    const supabase = createServiceClient();
    const reply = await handleTextToApply(from, body, supabase);

    // Return TwiML response
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(reply)}</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (err) {
    console.error("text-to-apply error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, something went wrong. Please try again later.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}

// Also support GET for testing
export async function GET() {
  return NextResponse.json({
    endpoint: "text-to-apply",
    description: "Twilio SMS webhook for text-to-apply hiring flow",
    usage: "Configure Twilio number SMS webhook → POST to this URL",
    test: "Send POST with Body=APPLY&From=+1234567890",
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
