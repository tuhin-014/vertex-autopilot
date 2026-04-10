import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ChecklistItem = { task: string; done: boolean; value?: string };
type ChecklistRow = {
  id: string;
  location_id: string;
  checklist_type: string;
  completed_by: string | null;
  completed_at: string;
  score: number | null;
  items: ChecklistItem[] | string | null;
  notes: string | null;
};

function parseItems(items: ChecklistItem[] | string | null): ChecklistItem[] {
  if (!items) return [];
  if (typeof items === "string") {
    try { return JSON.parse(items); } catch { return []; }
  }
  return items;
}

const TYPE_LABELS: Record<string, string> = {
  food_safety: "Food Safety",
  opening: "Opening",
  closing: "Closing",
  cleaning: "Cleaning",
};

const TYPE_ICONS: Record<string, string> = {
  food_safety: "🛡️",
  opening: "🌅",
  closing: "🌙",
  cleaning: "🧹",
};

export default async function ChecklistsPage() {
  const supabase = createServiceClient();

  const since24h = new Date(Date.now() - 24 * 3600000).toISOString();

  const [locRes, clRes] = await Promise.all([
    supabase.from("va_locations").select("id, name, city, state").order("name"),
    supabase.from("va_checklists").select("*").gte("completed_at", since24h).order("completed_at", { ascending: false }),
  ]);

  const locations = locRes.data || [];
  const checklists: ChecklistRow[] = clRes.data || [];

  const allTypes = ["food_safety", "opening", "closing", "cleaning"];
  const completedToday = checklists.length;
  const expectedToday = locations.length * 2; // food_safety + opening per location
  const completionRate = expectedToday > 0 ? Math.round((completedToday / expectedToday) * 100) : 0;

  // Group by location for the "missing checklists" view
  const locationStatus = locations.map((loc) => {
    const locChecklists = checklists.filter((c) => c.location_id === loc.id);
    const completed = new Set(locChecklists.map((c) => c.checklist_type));
    const missing = allTypes.filter((t) => !completed.has(t));
    return { location: loc, completed: locChecklists, missing };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Checklists</h1>
          <p className="text-gray-400">Compliance checklists across {locations.length} locations</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold">{locations.length}</div>
          <div className="text-sm text-gray-400 mt-1">Locations</div>
        </div>
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{completedToday}</div>
          <div className="text-sm text-gray-400 mt-1">Completed (24h)</div>
        </div>
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{completionRate}%</div>
          <div className="text-sm text-gray-400 mt-1">Completion Rate</div>
        </div>
        <div className="bg-gray-900 border border-red-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-400">
            {locationStatus.filter((l) => l.missing.includes("food_safety")).length}
          </div>
          <div className="text-sm text-gray-400 mt-1">Missing Food Safety</div>
        </div>
      </div>

      {/* Location status grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-semibold">Location Status (Last 24h)</h2>
        </div>
        {locationStatus.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No locations yet. Visit <a href="/api/seed-demo" className="text-blue-400 underline">/api/seed-demo</a> to populate demo data.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {locationStatus.map(({ location, completed, missing }) => (
              <div key={location.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{location.name}</div>
                    <div className="text-xs text-gray-500">{location.city}, {location.state}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {missing.length === 0 ? (
                      <span className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400">All complete</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-400">{missing.length} missing</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTypes.map((type) => {
                    const cl = completed.find((c) => c.checklist_type === type);
                    return (
                      <div
                        key={type}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                          cl
                            ? "bg-green-600/10 border border-green-600/30 text-green-400"
                            : "bg-gray-800 border border-gray-700 text-gray-500"
                        }`}
                      >
                        <span>{TYPE_ICONS[type]}</span>
                        <span>{TYPE_LABELS[type]}</span>
                        {cl?.score !== null && cl?.score !== undefined && <span className="font-bold">{cl.score}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent completions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="font-semibold">Recent Completions</h2>
        </div>
        {checklists.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">No completions yet</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {checklists.slice(0, 20).map((c) => {
              const loc = locations.find((l) => l.id === c.location_id);
              const items = parseItems(c.items);
              const doneCount = items.filter((i) => i.done).length;
              return (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{TYPE_ICONS[c.checklist_type] || "✅"}</span>
                    <div>
                      <div className="font-medium text-sm">{TYPE_LABELS[c.checklist_type] || c.checklist_type} - {loc?.name || "Unknown location"}</div>
                      <div className="text-xs text-gray-500">
                        By {c.completed_by} - {new Date(c.completed_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-400">{c.score}/100</div>
                    <div className="text-xs text-gray-500">{doneCount}/{items.length} items</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
