import { createServiceClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export default async function HiringPage() {
  const supabase = createServiceClient();

  // Get all locations
  const { data: locations } = await supabase.from("locations").select("id, name").order("name");

  // Staffing targets vs actual
  const { data: targets } = await supabase.from("staffing_targets").select("location_id, role, target_count, min_count");
  const { data: employees } = await supabase.from("employees").select("location_id, role");

  // Job postings
  const { data: jobs } = await supabase.from("job_postings").select("*").eq("status", "open").order("posted_at", { ascending: false });

  // Pipeline
  const { data: candidates } = await supabase.from("candidates_pipeline").select("*").order("created_at", { ascending: false }).limit(50);

  // Hiring events
  const { data: events } = await supabase
    .from("agent_events")
    .select("*")
    .eq("agent_type", "hiring")
    .order("created_at", { ascending: false })
    .limit(20);

  // Calculate staffing health per location
  const staffingHealth = locations?.map((loc) => {
    const locTargets = targets?.filter((t) => t.location_id === loc.id) || [];
    const locEmps = employees?.filter((e) => e.location_id === loc.id) || [];
    let totalTarget = 0;
    let totalActual = 0;
    let critical = false;

    for (const t of locTargets) {
      const actual = locEmps.filter((e) => e.role === t.role).length;
      totalTarget += t.target_count;
      totalActual += actual;
      if (actual < t.min_count) critical = true;
    }

    return { ...loc, totalTarget, totalActual, critical, pct: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 100 };
  }) || [];

  // Pipeline stats
  const applied = candidates?.filter((c) => c.stage === "applied").length || 0;
  const screened = candidates?.filter((c) => c.stage === "screened").length || 0;
  const interviewing = candidates?.filter((c) => c.stage === "interviewing").length || 0;
  const offered = candidates?.filter((c) => c.offer_sent).length || 0;
  const hired = candidates?.filter((c) => c.offer_accepted).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👥 Hiring Autopilot</h1>
          <p className="text-gray-400">Autonomous hiring pipeline across {locations?.length || 0} locations</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/cron/check-staffing"
            target="_blank"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition"
          >
            ▶ Check Staffing
          </a>
          <a
            href="/api/cron/screen-candidates"
            target="_blank"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
          >
            ▶ Screen Candidates
          </a>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Applied", count: applied, color: "blue" },
          { label: "Screened", count: screened, color: "purple" },
          { label: "Interviewing", count: interviewing, color: "yellow" },
          { label: "Offered", count: offered, color: "orange" },
          { label: "Hired", count: hired, color: "green" },
        ].map((stage) => (
          <div key={stage.label} className={`bg-${stage.color}-600/10 border border-${stage.color}-600/30 rounded-xl p-4 text-center`}>
            <div className={`text-3xl font-bold text-${stage.color}-400`}>{stage.count}</div>
            <div className="text-sm text-gray-400 mt-1">{stage.label}</div>
          </div>
        ))}
      </div>

      {/* Two columns: Staffing Health + Open Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Staffing Health */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">📊 Staffing Health</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {staffingHealth.map((loc) => (
              <div
                key={loc.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  loc.critical
                    ? "bg-red-600/10 border border-red-600/30"
                    : loc.pct < 100
                    ? "bg-yellow-600/10 border border-yellow-600/30"
                    : "bg-green-600/10 border border-green-600/30"
                }`}
              >
                <div>
                  <div className="text-sm font-medium truncate max-w-48">{loc.name}</div>
                  <div className="text-xs text-gray-500">{loc.totalActual}/{loc.totalTarget} staff</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${loc.critical ? "bg-red-500" : loc.pct < 100 ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min(100, loc.pct)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${loc.critical ? "text-red-400" : loc.pct < 100 ? "text-yellow-400" : "text-green-400"}`}>
                    {loc.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Jobs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">📋 Open Job Postings ({jobs?.length || 0})</h2>
          {jobs && jobs.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {jobs.map((job) => (
                <div key={job.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">{job.title}</div>
                      <div className="text-xs text-gray-500">
                        {job.pay_range} • {job.shift_type} • Posted {new Date(job.posted_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${job.source === "auto" ? "bg-blue-600/20 text-blue-400" : "bg-gray-700 text-gray-400"}`}>
                      {job.source === "auto" ? "Auto-posted" : "Manual"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No open positions. Run &quot;Check Staffing&quot; to detect understaffed locations and auto-post jobs.</p>
          )}
        </div>
      </div>

      {/* Candidate Pipeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">👤 Recent Candidates</h2>
        {candidates && candidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">AI Score</th>
                  <th className="text-left p-2">Stage</th>
                  <th className="text-left p-2">Applied</th>
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 15).map((c) => (
                  <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/50">
                    <td className="p-2 font-medium">{c.name}</td>
                    <td className="p-2 text-gray-400">{c.role_applied}</td>
                    <td className="p-2 text-gray-500">{c.source}</td>
                    <td className="p-2">
                      {c.ai_score !== null ? (
                        <span className={`font-bold ${c.ai_score >= 70 ? "text-green-400" : c.ai_score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                          {c.ai_score}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        c.stage === "hired" || c.stage === "onboarding" ? "bg-green-600/20 text-green-400" :
                        c.stage === "interviewing" ? "bg-yellow-600/20 text-yellow-400" :
                        c.stage === "screened" ? "bg-blue-600/20 text-blue-400" :
                        c.stage === "rejected" ? "bg-red-600/20 text-red-400" :
                        "bg-gray-700 text-gray-400"
                      }`}>
                        {c.stage}
                      </span>
                    </td>
                    <td className="p-2 text-gray-600">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            No candidates yet. Text &quot;APPLY&quot; to the hiring line, or run &quot;Screen Candidates&quot; after applications come in.
          </p>
        )}
      </div>

      {/* Text-to-Apply Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-3">📱 Text-to-Apply</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-2">Candidates text <strong>&quot;APPLY&quot;</strong> to your hiring number:</p>
          <p className="text-2xl font-mono font-bold text-blue-400">(478) 800-7647</p>
          <p className="text-xs text-gray-500 mt-2">
            Bot collects: name, position, availability, experience, certifications, start date → AI scores → top candidates get interview SMS
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Webhook: <code className="bg-gray-700 px-1 rounded">vertex-autopilot.vercel.app/api/sms/text-to-apply</code>
          </p>
        </div>
      </div>

      {/* Agent Activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">📋 Hiring Agent Activity</h2>
        {events && events.length > 0 ? (
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
                <span>
                  {ev.severity === "critical" ? "🔴" : ev.severity === "warning" ? "🟡" : ev.severity === "info" ? "🟢" : "⚪"}
                </span>
                <div className="flex-1">
                  <span className="text-gray-300">{ev.description}</span>
                  {ev.action_taken && <span className="text-gray-500 ml-2">→ {ev.action_taken}</span>}
                </div>
                <span className="text-gray-600 text-xs whitespace-nowrap">{new Date(ev.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hiring events yet. Run &quot;Check Staffing&quot; to get started.</p>
        )}
      </div>
    </div>
  );
}
