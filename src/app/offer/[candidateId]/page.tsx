"use client";

import { useEffect, useState, useRef } from "react";

export default function OfferSignPage({ params }: { params: Promise<{ candidateId: string }> }) {
  const [candidateId, setCandidateId] = useState("");
  const [offerHtml, setOfferHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    params.then(async (p) => {
      setCandidateId(p.candidateId);
      const res = await fetch(`/api/offer-letter/${p.candidateId}`);
      if (res.ok) {
        const html = await res.text();
        setOfferHtml(html);
      }
      setLoading(false);
    });
  }, [params]);

  // Canvas drawing handlers
  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() { setIsDrawing(false); }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSign() {
    if (!hasSignature) return;
    setSigning(true);

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas?.toDataURL("image/png") || "";

    await fetch(`/api/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offer_accepted: true,
        stage: "hired",
        metadata: { signature_data: signatureDataUrl, signed_at: new Date().toISOString() },
      }),
    });

    setSigned(true);
    setSigning(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">Loading offer letter...</div>;

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-center max-w-md">
          <span className="text-6xl">🎉</span>
          <h1 className="text-3xl font-bold mt-4">Welcome to the team!</h1>
          <p className="text-gray-600 mt-2">Your offer has been signed and accepted. We&#39;ll be in touch with next steps for your onboarding.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offer Letter Content */}
      <div className="max-w-700 mx-auto bg-white shadow-lg" style={{ maxWidth: 700 }}>
        <div dangerouslySetInnerHTML={{ __html: offerHtml }} />

        {/* Signature Section */}
        <div className="px-10 pb-10">
          <div className="border-t-2 border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">✍️ Sign Here</h3>
            <p className="text-sm text-gray-600 mb-4">Draw your signature below to accept this offer.</p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-300 text-sm">Draw signature here</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleSign} disabled={!hasSignature || signing}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition disabled:opacity-50">
                {signing ? "Signing..." : "✅ Accept & Sign Offer"}
              </button>
              <button onClick={clearSignature} className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm">
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
