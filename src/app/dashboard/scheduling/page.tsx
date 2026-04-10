import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Loc = { id: string; name: string; staff_count: number | null };
type Training = { location_id: string; status: string };

export default async function SchedulingPage() {
  const supabase = createServiceClient();

  const [locsRes, trRes, candRes] = await Promise.all([
    supabase.from("va_locations").select("id, name, staff_count").order("name"),
    supabase.from("va_training").select("location_id, status"),
    supabase.from("va_candidates").select("location_id, stage"),
  ]);

  const locations: Loc[] = locsRes.data || [];
  const trainings: Training[] = trRes.data || [];
  const candidates = candRes.data || [];

  // Derived metrics
  const totalStaff = locations.reduce((s, l) => s + (l.staff_count || 0), 0);
  const inHiringPipeline = candidates.filter((c) => c.stage !== "rejected").length;
  const overdueTraining = trainings.filter((t) => t.status === "overdue").length;
  const inProgressTraining = trainings.filter((t) => t.status === "in_progress").length;

  // Per-location coverage — staff_count vs a target (target = staff_count + 2 for "ideal coverage")
  const coverage = locations.map((l) => {
    const current = l.staff_count || 0;
    const target = Math.max(current, current + 2);
    const pct = target > 0 ? Math.round((current / target) * 100) : 0;
    return { ...l, current, target, pct };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Scheduling</h1>
          <p className="text-gray-400">
            Shift management across {locations.length} location{locations.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/dashboard/agents/staffing"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition text-white"
        >
          View Staffing Agent
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Staff" value={totalStaff} color="text-blue-400" />
        <StatCard label="Hiring Pipeline" value={inHiringPipeline} color="text-purple-400" />
        <StatCard label="Training In Progress" value={inProgressTraining} color="text-yellow-400" />
        <StatCard
          label="Overdue Training"
          value={overdueTraining}
          color={overdueTraining > 0 ? "text-red-400" : "text-gray-400"}
        />
      </div>

      {/* Coverage by Location */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4 text-white">Staffing Coverage by Location</h2>
        {coverage.length === 0 && (
          <p className="text-sm text-gray-500">
            No locations yet. Run <code className="text-blue-400">/api/seed-demo</code> to populate.
          </p>
        )}
        <div className="space-y-2">
          {coverage.map((loc) => (
            <div key={loc.id} className="flex items-center gap-3 p-2">
              <span className="text-sm text-gray-300 w-56 truncate">{loc.name}</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    loc.pct >= 100 ? "bg-green-500" : loc.pct >= 80 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(100, loc.pct)}%` }}
                />
              </div>
              <span
                className={`text-xs font-bold w-12 text-right ${
                  loc.pct >= 100 ? "text-green-400" : loc.pct >= 80 ? "text-yellow-400" : "text-red-400"
                }`}
              >
                {loc.pct}%
              </span>
              <span className="text-xs text-gray-500 w-16 text-right">
                {loc.current}/{loc.target}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
