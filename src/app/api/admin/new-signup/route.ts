import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const ADMIN_EMAIL = 'tuhin014@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, plan, app } = body;

    const appName = app || 'LandlordFlow';
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    const subject = `🎉 New ${appName} Signup — ${name || email || 'Unknown'}`;
    const html = `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#059669">🎉 New Signup!</h2>
        <p style="font-size:14px;color:#6b7280">${appName} • ${timestamp}</p>
        
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:16px 0">
          <table style="width:100%;font-size:14px">
            ${name ? `<tr><td style="color:#6b7280;padding:4px 0">Name</td><td style="font-weight:bold">${name}</td></tr>` : ''}
            ${email ? `<tr><td style="color:#6b7280;padding:4px 0">Email</td><td style="font-weight:bold">${email}</td></tr>` : ''}
            ${phone ? `<tr><td style="color:#6b7280;padding:4px 0">Phone</td><td>${phone}</td></tr>` : ''}
            ${company ? `<tr><td style="color:#6b7280;padding:4px 0">Company</td><td>${company}</td></tr>` : ''}
            <tr><td style="color:#6b7280;padding:4px 0">Plan</td><td style="font-weight:bold;color:#059669">${plan || 'trial'}</td></tr>
          </table>
        </div>

        <p style="font-size:12px;color:#9ca3af">This is an automated notification from ${appName}.</p>
      </div>`;

    if (!RESEND_API_KEY) {
      console.log(`[Admin Notify] New signup: ${email} (Resend key not configured)`);
      return NextResponse.json({ ok: true, skipped: 'Resend API key not configured' });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${appName} <hello@vertexlabsolutions.com>`,
        to: ADMIN_EMAIL,
        subject,
        html,
      }),
    });

    const data = await res.json();
    return NextResponse.json({ ok: res.ok, data });
  } catch (error) {
    console.error('Admin notify error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to send notification' }, { status: 500 });
  }
}
