"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Organization
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("restaurant");

  // Step 2: First location
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [storeState, setStoreState] = useState("");
  const [storeZip, setStoreZip] = useState("");

  // Step 3: Manager
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  // Step 4: Preferences
  const [enableSafety, setEnableSafety] = useState(true);
  const [enableHiring, setEnableHiring] = useState(true);

  const [orgId, setOrgId] = useState("");
  const [locationId, setLocationId] = useState("");

  async function handleStep1() {
    if (!orgName) { setError("Organization name required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/onboarding/create-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, industry }),
      });
      const data = await res.json();
      if (data.orgId) { setOrgId(data.orgId); setStep(2); }
      else { setError(data.error || "Failed to create organization"); }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function handleStep2() {
    if (!storeName || !storeAddress) { setError("Store name and address required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/onboarding/add-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, name: storeName, address: storeAddress, city: storeCity, state: storeState, zip: storeZip }),
      });
      const data = await res.json();
      if (data.locationId) { setLocationId(data.locationId); setStep(3); }
      else { setError(data.error || "Failed to add location"); }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function handleStep3() {
    if (!managerName) { setError("Manager name required"); return; }
    setLoading(true); setError("");
    try {
      await fetch("/api/onboarding/add-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, locationId, name: managerName, phone: managerPhone, email: managerEmail }),
      });
      setStep(4);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  async function handleStep4() {
    setLoading(true); setError("");
    try {
      await fetch("/api/onboarding/setup-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, locationId, enableSafety, enableHiring }),
      });

      // Notify admin of new signup (fire-and-forget)
      fetch('/api/admin/new-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: managerName,
          email: managerEmail,
          phone: managerPhone,
          company: orgName,
          plan: 'trial',
          app: 'Vertex Autopilot',
        }),
      }).catch(() => {});

      router.push("/dashboard");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${s <= step ? "text-blue-400" : "text-gray-600"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s < step ? "bg-blue-600 text-white" : s === step ? "bg-blue-600/20 border-2 border-blue-500 text-blue-400" : "bg-gray-800 text-gray-500"
              }`}>{s}</div>
              {s < 4 && <div className={`w-8 h-0.5 ${s < step ? "bg-blue-600" : "bg-gray-700"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-6">
            <span className="text-4xl">{step === 1 ? "🏢" : step === 2 ? "📍" : step === 3 ? "👤" : "🤖"}</span>
            <h1 className="text-2xl font-bold mt-2">
              {step === 1 ? "Create Your Organization" : step === 2 ? "Add Your First Location" : step === 3 ? "Add Store Manager" : "Configure Agents"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {step === 1 ? "Tell us about your business" : step === 2 ? "Where's your first store?" : step === 3 ? "Who manages this location?" : "Which AI agents do you want active?"}
            </p>
          </div>

          {error && <div className="bg-red-600/10 border border-red-600/30 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name (e.g. IHOP Southeast)" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white">
                <option value="restaurant">Restaurant / Food Service</option>
                <option value="hotel">Hotel / Hospitality</option>
                <option value="retail">Retail</option>
                <option value="healthcare">Healthcare</option>
                <option value="other">Other</option>
              </select>
              <button onClick={handleStep1} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium disabled:opacity-50">{loading ? "Creating..." : "Continue →"}</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store name (e.g. IHOP #1 — Capital Blvd)" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              <input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} placeholder="Street address" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              <div className="grid grid-cols-3 gap-3">
                <input value={storeCity} onChange={(e) => setStoreCity(e.target.value)} placeholder="City" className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={storeState} onChange={(e) => setStoreState(e.target.value)} placeholder="State" className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={storeZip} onChange={(e) => setStoreZip(e.target.value)} placeholder="ZIP" className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              </div>
              <button onClick={handleStep2} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium disabled:opacity-50">{loading ? "Adding..." : "Continue →"}</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Manager name" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              <input value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} placeholder="Phone (for SMS alerts)" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              <input value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              <button onClick={handleStep3} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium disabled:opacity-50">{loading ? "Saving..." : "Continue →"}</button>
              <button onClick={() => setStep(4)} className="w-full py-2 text-gray-500 text-sm hover:text-gray-300">Skip for now</button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer">
                <div>
                  <div className="font-medium">🛡️ Food Safety Autopilot</div>
                  <div className="text-xs text-gray-500">Temp logs, certs, corrective actions</div>
                </div>
                <input type="checkbox" checked={enableSafety} onChange={(e) => setEnableSafety(e.target.checked)} className="w-5 h-5 accent-blue-600" />
              </label>
              <label className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer">
                <div>
                  <div className="font-medium">👥 Hiring Autopilot</div>
                  <div className="text-xs text-gray-500">Staffing detection, screening, text-to-apply</div>
                </div>
                <input type="checkbox" checked={enableHiring} onChange={(e) => setEnableHiring(e.target.checked)} className="w-5 h-5 accent-blue-600" />
              </label>
              <button onClick={handleStep4} disabled={loading} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-medium disabled:opacity-50">{loading ? "Setting up..." : "🚀 Launch Dashboard"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
