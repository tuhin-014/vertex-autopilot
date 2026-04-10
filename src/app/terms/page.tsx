import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-xl">Vertex Autopilot</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-16 prose prose-invert">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: April 9, 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p>By accessing or using Vertex Autopilot (&quot;the Service&quot;), operated by VertexLab Solutions LLC (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. Description of Service</h2>
            <p>Vertex Autopilot is an AI-powered operations management platform designed for multi-location restaurant operators. The Service includes automated monitoring, alerting, reporting, and decision-support tools.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. Subscriptions and Billing</h2>
            <p>Paid plans are billed monthly. You may cancel at any time. Cancellations take effect at the end of the current billing period. Refunds are provided on a case-by-case basis at our discretion.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate information and use the Service in compliance with applicable laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. Data Ownership</h2>
            <p>You retain ownership of all data you submit to the Service. We do not sell your data. We use your data solely to provide and improve the Service as described in our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. Limitation of Liability</h2>
            <p>The Service is provided &quot;as is&quot; without warranties of any kind. VertexLab Solutions LLC shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. Contact</h2>
            <p>VertexLab Solutions LLC<br />Email: vertexlabsolutions@gmail.com<br />Website: vertexlabsolutions.com</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-800 px-8 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 text-sm">
            &copy; 2026 VertexLab Solutions LLC. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
