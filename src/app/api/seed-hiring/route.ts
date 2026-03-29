import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const results: string[] = [];

  // Get first 3 locations
  const { data: locations } = await supabase.from("locations").select("id, name").limit(3);
  if (!locations || locations.length === 0) return NextResponse.json({ error: "No locations found. Run /api/seed first." });

  // Create sample job postings
  const jobData = [
    { location_id: locations[0].id, role: "server", title: `Server / Wait Staff — ${locations[0].name}`, pay_range: "$12-16/hr + tips", shift_type: "full-time" },
    { location_id: locations[0].id, role: "cook", title: `Line Cook — ${locations[0].name}`, pay_range: "$14-18/hr", shift_type: "full-time" },
    { location_id: locations[1].id, role: "host", title: `Host / Hostess — ${locations[1].name}`, pay_range: "$11-14/hr", shift_type: "part-time" },
    { location_id: locations[1].id, role: "server", title: `Server / Wait Staff — ${locations[1].name}`, pay_range: "$12-16/hr + tips", shift_type: "full-time" },
    { location_id: locations[2].id, role: "dishwasher", title: `Dishwasher — ${locations[2].name}`, pay_range: "$11-13/hr", shift_type: "full-time" },
  ];

  const { data: jobs } = await supabase.from("job_postings").insert(
    jobData.map((j) => ({ ...j, source: "auto", status: "open", description: "Auto-posted by Vertex Hire agent" }))
  ).select("id, role, location_id");
  results.push(`Created ${jobs?.length || 0} job postings`);

  // Create sample candidates at different pipeline stages
  const candidateData = [
    { name: "Alex Rivera", phone: "+19195551001", role_applied: "server", experience_years: 2, availability: "full-time, any shift", distance_miles: 3, has_certifications: true, response_quality: "excellent", source: "text-to-apply", stage: "applied" },
    { name: "Jordan Lee", phone: "+19195551002", role_applied: "server", experience_years: 0, availability: "weekends only", distance_miles: 12, has_certifications: false, response_quality: "good", source: "text-to-apply", stage: "applied" },
    { name: "Priya Patel", phone: "+19195551003", role_applied: "cook", experience_years: 4, availability: "full-time", distance_miles: 5, has_certifications: true, response_quality: "excellent", source: "text-to-apply", stage: "applied" },
    { name: "Marcus Thompson", phone: "+19195551004", role_applied: "cook", experience_years: 1, availability: "part-time evenings", distance_miles: 8, has_certifications: false, response_quality: "good", source: "text-to-apply", stage: "applied" },
    { name: "Sofia Hernandez", phone: "+19195551005", role_applied: "host", experience_years: 1, availability: "full-time", distance_miles: 2, has_certifications: false, response_quality: "great", source: "text-to-apply", stage: "applied" },
    { name: "Tyler Brooks", phone: "+19195551006", role_applied: "dishwasher", experience_years: 0, availability: "any", distance_miles: 4, has_certifications: false, response_quality: "ok", source: "text-to-apply", stage: "applied" },
    { name: "Aisha Williams", phone: "+19195551007", role_applied: "server", experience_years: 3, availability: "open availability", distance_miles: 6, has_certifications: true, response_quality: "excellent", source: "indeed", stage: "applied" },
    { name: "Ryan Chen", phone: "+19195551008", role_applied: "cook", experience_years: 5, availability: "full-time mornings", distance_miles: 10, has_certifications: true, response_quality: "good", source: "indeed", stage: "applied" },
  ];

  for (const c of candidateData) {
    const matchingJob = jobs?.find((j) => j.role === c.role_applied) || jobs?.[0];
    await supabase.from("candidates_pipeline").insert({
      ...c,
      job_posting_id: matchingJob?.id,
      location_id: matchingJob?.location_id || locations[0].id,
    });
  }
  results.push(`Created ${candidateData.length} sample candidates (all 'applied' stage — run Screen Candidates to AI-score them)`);

  return NextResponse.json({ success: true, results });
}
