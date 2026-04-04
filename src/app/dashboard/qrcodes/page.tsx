import { createServiceClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export default async function QRCodesPage() {
  const supabase = createServiceClient();
  const { data: locations } = await supabase.from("locations").select("id, name").order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📱 Mobile Temp Log QR Codes</h1>
        <p className="text-gray-400">Print these QR codes and post them in each store&apos;s kitchen. Staff scan to log temperatures from their phone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations?.map((loc) => {
          const url = `https://vertex-autopilot.vercel.app/log/${loc.id}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

          return (
            <div key={loc.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center print:border print:border-gray-300">
              <h3 className="font-bold mb-3 text-sm">{loc.name}</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt={`QR code for ${loc.name}`} className="mx-auto mb-3 rounded-lg" width={200} height={200} />
              <p className="text-xs text-gray-500 mb-2">Scan to log temperatures</p>
              <a href={url} target="_blank" className="text-xs text-blue-400 hover:underline break-all">{url}</a>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button onClick={() => {}} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">
          🖨️ Print All QR Codes
        </button>
      </div>
    </div>
  );
}
