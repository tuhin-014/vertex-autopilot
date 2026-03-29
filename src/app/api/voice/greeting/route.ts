// Twilio voice webhook — plays greeting when someone calls the hiring number
export async function POST() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Thank you for calling Vertex Hire, the AI-powered hiring platform.
    To apply for a job, please hang up and text the word APPLY to this number.
    For restaurant phone orders, please call 7 7 1, 2 5 3, 7 5 4 4.
    Thank you, and have a great day!
  </Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">
    Again, to apply for a job, text APPLY to this number. Goodbye!
  </Say>
</Response>`;

  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

export async function GET() {
  return POST();
}
