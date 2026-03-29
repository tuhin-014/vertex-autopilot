import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-xl">Vertex Autopilot</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-16 prose prose-invert">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: March 29, 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white">1. Information We Collect</h2>
            <p>Vertex Autopilot collects the following information to provide our AI operations management services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account information (name, email, organization)</li>
              <li>Employee data (names, roles, certifications, contact information)</li>
              <li>Operational data (temperature logs, inspection scores, corrective actions)</li>
              <li>Hiring data (candidate applications, screening scores, interview records)</li>
              <li>Usage data (dashboard interactions, feature usage)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide AI-powered food safety monitoring and alerts</li>
              <li>Automate hiring pipeline management</li>
              <li>Generate operational insights and recommendations</li>
              <li>Send SMS and email notifications as configured</li>
              <li>Generate reports and analytics</li>
              <li>Improve our services and AI models</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. Data Storage & Security</h2>
            <p>Data is stored securely on Supabase (PostgreSQL) with row-level security enabled. All API communications use HTTPS encryption. We do not sell or share your data with third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. Third-Party Services</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> — Database and authentication</li>
              <li><strong>Twilio</strong> — SMS notifications and text-to-apply</li>
              <li><strong>Resend</strong> — Email notifications and reports</li>
              <li><strong>Stripe</strong> — Payment processing</li>
              <li><strong>Vercel</strong> — Application hosting</li>
              <li><strong>Open-Meteo</strong> — Weather data (no personal data sent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your data at any time by contacting us at sales@vertexlabsolutions.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. Contact us at sales@vertexlabsolutions.com for any data requests.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. Contact</h2>
            <p>Vertex Lab Solutions<br />Email: sales@vertexlabsolutions.com<br />Website: vertexlabsolutions.com</p>
          </section>
        </div>
      </main>
    </div>
  );
}
