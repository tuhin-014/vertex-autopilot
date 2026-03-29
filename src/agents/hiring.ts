import { BaseAgent, AgentEvent, Severity } from "./base-agent";
import { sendSMS, understaffingAlertSMS, interviewInviteSMS } from "@/lib/sms/twilio";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vertex-autopilot.vercel.app";

// AI Screening weights
const SCORING_WEIGHTS = {
  experience: 0.30,
  availability: 0.25,
  distance: 0.15,
  certifications: 0.15,
  response_quality: 0.15,
};

const JOB_TEMPLATES: Record<string, { title: string; description: string; requirements: string; pay_range: string }> = {
  server: {
    title: "Server / Wait Staff",
    description: "Provide excellent dining experiences for IHOP guests. Take orders, serve food, and ensure customer satisfaction.",
    requirements: "Must be 18+, able to work on feet for extended periods. Previous restaurant experience preferred.",
    pay_range: "$12-16/hr + tips",
  },
  cook: {
    title: "Line Cook / Kitchen Staff",
    description: "Prepare IHOP menu items to quality standards. Maintain food safety and kitchen cleanliness.",
    requirements: "Food handler certification preferred. Ability to work in fast-paced environment. Must handle heat/sharp objects safely.",
    pay_range: "$14-18/hr",
  },
  host: {
    title: "Host / Hostess",
    description: "Greet and seat guests, manage waitlist, answer phones, and maintain front-of-house flow.",
    requirements: "Friendly personality, basic math skills for table management. Must be 16+.",
    pay_range: "$11-14/hr",
  },
  dishwasher: {
    title: "Dishwasher / Utility",
    description: "Maintain clean dishes, utensils, and kitchen equipment. Assist with basic food prep as needed.",
    requirements: "Ability to stand for long periods and lift 30+ lbs. No experience needed — will train!",
    pay_range: "$11-13/hr",
  },
  manager: {
    title: "Shift Manager",
    description: "Lead daily restaurant operations, supervise team, manage inventory, and ensure quality/safety standards.",
    requirements: "2+ years restaurant management experience. ServSafe certified. Strong leadership skills.",
    pay_range: "$18-24/hr",
  },
};

export class HiringAgent extends BaseAgent {
  constructor() {
    super("hiring");
  }

  async check(): Promise<AgentEvent[]> {
    return [];
  }

  // ── 1. Check Understaffing ──
  async checkStaffing(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get all staffing targets
    const { data: targets } = await this.supabase
      .from("staffing_targets")
      .select("*, locations!inner(id, name)");

    if (!targets) return events;

    for (const target of targets) {
      // Count current employees at this location with this role
      const { count } = await this.supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("location_id", target.location_id)
        .eq("role", target.role);

      const currentCount = count || 0;
      const locationName = (target as Record<string, unknown>).locations
        ? ((target as Record<string, unknown>).locations as Record<string, string>).name
        : "Unknown Store";

      if (currentCount >= target.target_count) continue; // Fully staffed

      const isCritical = currentCount < target.min_count;
      const severity: Severity = isCritical ? "critical" : "warning";

      // Check if we already alerted today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "understaffed")
        .eq("location_id", target.location_id)
        .eq("metadata->>role", target.role)
        .gte("created_at", todayStart.toISOString())
        .single();

      if (existing) continue;

      // Check if there's already an open job posting for this role at this location
      const { data: existingJob } = await this.supabase
        .from("job_postings")
        .select("id")
        .eq("location_id", target.location_id)
        .eq("role", target.role)
        .eq("status", "open")
        .single();

      let jobPostingId: string | null = existingJob?.id || null;

      // Auto-post job if none exists
      if (!jobPostingId) {
        const template = JOB_TEMPLATES[target.role] || JOB_TEMPLATES.server;
        const { data: newJob } = await this.supabase
          .from("job_postings")
          .insert({
            location_id: target.location_id,
            role: target.role,
            title: `${template.title} — ${locationName}`,
            description: template.description,
            requirements: template.requirements,
            pay_range: template.pay_range,
            source: "auto",
            status: "open",
          })
          .select("id")
          .single();

        jobPostingId = newJob?.id || null;
      }

      const event: AgentEvent = {
        agent_type: "hiring",
        event_type: "understaffed",
        location_id: target.location_id,
        severity,
        description: `${isCritical ? "🚨 CRITICAL" : "⚠️"} ${locationName} — ${target.role} understaffed: ${currentCount}/${target.target_count} (min: ${target.min_count})`,
        action_taken: jobPostingId
          ? `Job auto-posted: ${JOB_TEMPLATES[target.role]?.title || target.role}`
          : "Alert sent to manager",
        metadata: {
          role: target.role,
          current_count: currentCount,
          target_count: target.target_count,
          min_count: target.min_count,
          job_posting_id: jobPostingId,
        },
      };

      const eventId = await this.logEvent(event);

      // Notify store manager
      const { data: manager } = await this.supabase
        .from("employees")
        .select("phone, email, name")
        .eq("location_id", target.location_id)
        .eq("role", "manager")
        .limit(1)
        .single();

      if (manager?.phone) {
        const smsBody = understaffingAlertSMS(locationName, target.role, currentCount, target.target_count);
        await this.notify(severity, { phone: manager.phone, email: manager.email, name: manager.name }, smsBody, undefined, undefined, eventId);
      }

      events.push(event);
    }

    return events;
  }

  // ── 2. AI Candidate Screening ──
  async screenCandidates(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get unscored candidates
    const { data: candidates } = await this.supabase
      .from("candidates_pipeline")
      .select("*, job_postings!inner(location_id, role, title)")
      .eq("stage", "applied")
      .is("ai_score", null);

    if (!candidates) return events;

    for (const candidate of candidates) {
      const score = this.calculateScore(candidate);

      // Update candidate with score
      await this.supabase
        .from("candidates_pipeline")
        .update({
          ai_score: score.total,
          ai_score_breakdown: score.breakdown,
          stage: score.total >= 70 ? "screened" : "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidate.id);

      const job = candidate.job_postings as Record<string, string>;

      if (score.total >= 70) {
        // High scorer — send interview invite
        const event: AgentEvent = {
          agent_type: "hiring",
          event_type: "candidate_screened",
          location_id: job.location_id,
          severity: "info",
          description: `✅ ${candidate.name} scored ${score.total}/100 for ${job.title} — interview invite sent`,
          action_taken: `SMS sent to candidate (${candidate.phone})`,
          metadata: {
            candidate_id: candidate.id,
            score: score.total,
            breakdown: score.breakdown,
          },
        };

        const eventId = await this.logEvent(event);

        // Get location name for SMS
        const { data: location } = await this.supabase
          .from("locations")
          .select("name")
          .eq("id", job.location_id)
          .single();

        if (candidate.phone) {
          const smsBody = interviewInviteSMS(
            candidate.name,
            candidate.role_applied,
            location?.name || "IHOP",
            `${BASE_URL}/dashboard/hiring`
          );
          await this.notify("info", { phone: candidate.phone, name: candidate.name }, smsBody, undefined, undefined, eventId);
        }

        events.push(event);
      } else {
        // Low scorer — log rejection
        const event: AgentEvent = {
          agent_type: "hiring",
          event_type: "candidate_rejected",
          location_id: job.location_id,
          severity: "log",
          description: `❌ ${candidate.name} scored ${score.total}/100 for ${job.title} — below threshold`,
          metadata: {
            candidate_id: candidate.id,
            score: score.total,
            breakdown: score.breakdown,
          },
        };
        await this.logEvent(event);
        events.push(event);
      }
    }

    return events;
  }

  // ── 3. Follow Up on Interviews ──
  async checkInterviews(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get candidates with past interview dates that haven't been updated
    const now = new Date().toISOString();
    const { data: pastInterviews } = await this.supabase
      .from("candidates_pipeline")
      .select("*, job_postings!inner(location_id, title)")
      .eq("stage", "interviewing")
      .lt("interview_date", now);

    if (!pastInterviews) return events;

    for (const candidate of pastInterviews) {
      const job = candidate.job_postings as Record<string, string>;
      const hoursAgo = Math.round((Date.now() - new Date(candidate.interview_date).getTime()) / (1000 * 60 * 60));

      if (hoursAgo < 24) continue; // Give 24 hours after interview

      // Check if already reminded
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "interview_followup")
        .eq("metadata->>candidate_id", candidate.id)
        .single();

      if (existing) continue;

      const event: AgentEvent = {
        agent_type: "hiring",
        event_type: "interview_followup",
        location_id: job.location_id,
        severity: "warning",
        description: `📋 Interview follow-up needed: ${candidate.name} for ${job.title} (interviewed ${hoursAgo}h ago)`,
        action_taken: "Reminder sent to manager — approve or reject candidate",
        metadata: {
          candidate_id: candidate.id,
          hours_since_interview: hoursAgo,
        },
      };

      await this.logEvent(event);

      // Create approval request for manager
      await this.requestApproval("hire_decision", job.location_id, {
        candidate_id: candidate.id,
        candidate_name: candidate.name,
        role: candidate.role_applied,
        ai_score: candidate.ai_score,
        interview_date: candidate.interview_date,
      });

      events.push(event);
    }

    return events;
  }

  // ── 4. Auto-Onboarding for Accepted Offers ──
  async processAcceptedOffers(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    const { data: accepted } = await this.supabase
      .from("candidates_pipeline")
      .select("*, job_postings!inner(location_id, role, title)")
      .eq("offer_accepted", true)
      .eq("onboarding_started", false);

    if (!accepted) return events;

    for (const candidate of accepted) {
      const job = candidate.job_postings as Record<string, string>;

      // Mark onboarding started
      await this.supabase
        .from("candidates_pipeline")
        .update({ onboarding_started: true, stage: "onboarding", updated_at: new Date().toISOString() })
        .eq("id", candidate.id);

      const event: AgentEvent = {
        agent_type: "hiring",
        event_type: "onboarding_started",
        location_id: job.location_id,
        severity: "info",
        description: `🎉 ${candidate.name} accepted offer for ${job.title} — onboarding started`,
        action_taken: "Onboarding checklist created, Vertex Train enrollment pending",
        metadata: {
          candidate_id: candidate.id,
          role: candidate.role_applied,
        },
      };

      await this.logEvent(event);

      // Send welcome SMS to new hire
      if (candidate.phone) {
        await sendSMS(candidate.phone,
          `🎉 Welcome to the team, ${candidate.name}! Your onboarding for ${job.title} begins soon. We'll send you details shortly.\n—Vertex Hire`
        );
      }

      events.push(event);
    }

    return events;
  }

  // ── Scoring Engine ──
  private calculateScore(candidate: Record<string, unknown>): { total: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};

    // Experience (0-100)
    const expYears = Number(candidate.experience_years) || 0;
    if (expYears >= 3) breakdown.experience = 100;
    else if (expYears >= 1) breakdown.experience = 75;
    else if (expYears > 0) breakdown.experience = 50;
    else breakdown.experience = 25;

    // Availability (0-100)
    const avail = String(candidate.availability || "").toLowerCase();
    if (avail.includes("full") || avail.includes("any") || avail.includes("open")) breakdown.availability = 100;
    else if (avail.includes("part") || avail.includes("weekend")) breakdown.availability = 60;
    else if (avail) breakdown.availability = 40;
    else breakdown.availability = 20;

    // Distance (0-100)
    const dist = Number(candidate.distance_miles) || 0;
    if (dist === 0) breakdown.distance = 50; // Unknown
    else if (dist <= 5) breakdown.distance = 100;
    else if (dist <= 10) breakdown.distance = 75;
    else if (dist <= 15) breakdown.distance = 50;
    else breakdown.distance = 25;

    // Certifications (0-100)
    breakdown.certifications = candidate.has_certifications ? 100 : 30;

    // Response quality (0-100)
    const quality = String(candidate.response_quality || "").toLowerCase();
    if (quality.includes("excellent") || quality.includes("great")) breakdown.response_quality = 100;
    else if (quality.includes("good")) breakdown.response_quality = 75;
    else if (quality.includes("ok") || quality.includes("average")) breakdown.response_quality = 50;
    else breakdown.response_quality = 40;

    // Weighted total
    const total = Math.round(
      breakdown.experience * SCORING_WEIGHTS.experience +
      breakdown.availability * SCORING_WEIGHTS.availability +
      breakdown.distance * SCORING_WEIGHTS.distance +
      breakdown.certifications * SCORING_WEIGHTS.certifications +
      breakdown.response_quality * SCORING_WEIGHTS.response_quality
    );

    return { total, breakdown };
  }
}

// ── Text-to-Apply Conversation Handler ──
export async function handleTextToApply(
  phone: string,
  message: string,
  supabase: ReturnType<typeof import("@/lib/supabase/server").createServiceClient>
): Promise<string> {
  // Get or create session
  let { data: session } = await supabase
    .from("text_to_apply_sessions")
    .select("*")
    .eq("phone", phone)
    .eq("completed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const msg = message.trim().toLowerCase();

  // If no session and message contains "apply", start new session
  if (!session) {
    if (!msg.includes("apply") && !msg.includes("job") && !msg.includes("hire") && !msg.includes("work")) {
      return "Thanks for texting! If you're looking for a job, text APPLY to get started. 📱";
    }

    // Find nearest location (for now, pick first one with open jobs)
    const { data: openJob } = await supabase
      .from("job_postings")
      .select("location_id, locations!inner(name)")
      .eq("status", "open")
      .limit(1)
      .single();

    const locationId = openJob?.location_id || null;

    const { data: newSession } = await supabase
      .from("text_to_apply_sessions")
      .insert({ phone, location_id: locationId, step: 1, responses: {} })
      .select("*")
      .single();

    session = newSession;

    const locationName = openJob?.locations ? (openJob.locations as unknown as Record<string, string>).name : "IHOP";
    return `Thanks for your interest in ${locationName}! 🎉\n\nQuick questions:\n1️⃣ What's your full name?`;
  }

  // Process based on step
  const step = session.step || 1;
  const responses = (session.responses || {}) as Record<string, string>;

  switch (step) {
    case 1: // Name
      responses.name = message.trim();
      await supabase.from("text_to_apply_sessions").update({ step: 2, responses, updated_at: new Date().toISOString() }).eq("id", session.id);
      return `Got it, ${responses.name}! 👍\n\n2️⃣ What position are you interested in?\n• Server\n• Cook\n• Host\n• Dishwasher`;

    case 2: // Position
      responses.position = message.trim();
      await supabase.from("text_to_apply_sessions").update({ step: 3, responses, updated_at: new Date().toISOString() }).eq("id", session.id);
      return `3️⃣ Full-time or part-time?`;

    case 3: // Availability
      responses.availability = message.trim();
      await supabase.from("text_to_apply_sessions").update({ step: 4, responses, updated_at: new Date().toISOString() }).eq("id", session.id);
      return `4️⃣ How many years of restaurant experience do you have? (0 is fine!)`;

    case 4: // Experience
      responses.experience = message.trim();
      await supabase.from("text_to_apply_sessions").update({ step: 5, responses, updated_at: new Date().toISOString() }).eq("id", session.id);
      return `5️⃣ Do you have a food handler certification? (yes/no)`;

    case 5: // Certifications
      responses.certifications = message.trim();
      await supabase.from("text_to_apply_sessions").update({ step: 6, responses, updated_at: new Date().toISOString() }).eq("id", session.id);
      return `Last one! 6️⃣ When can you start?`;

    case 6: { // Start date — complete!
      responses.start_date = message.trim();

      // Determine role
      const roleInput = (responses.position || "").toLowerCase();
      let role = "server";
      if (roleInput.includes("cook") || roleInput.includes("kitchen")) role = "cook";
      else if (roleInput.includes("host")) role = "host";
      else if (roleInput.includes("dish")) role = "dishwasher";
      else if (roleInput.includes("manage")) role = "manager";

      // Find matching open job
      const { data: job } = await supabase
        .from("job_postings")
        .select("id, location_id")
        .eq("location_id", session.location_id)
        .eq("role", role)
        .eq("status", "open")
        .limit(1)
        .single();

      // Parse experience years
      const expMatch = (responses.experience || "").match(/(\d+)/);
      const expYears = expMatch ? parseInt(expMatch[1]) : 0;

      // Create candidate
      const { data: candidate } = await supabase
        .from("candidates_pipeline")
        .insert({
          job_posting_id: job?.id || null,
          location_id: session.location_id,
          name: responses.name,
          phone: phone,
          role_applied: role,
          source: "text-to-apply",
          experience_years: expYears,
          availability: responses.availability,
          has_certifications: (responses.certifications || "").toLowerCase().includes("yes"),
          response_quality: "good",
          stage: "applied",
          metadata: { responses, start_date: responses.start_date },
        })
        .select("id")
        .single();

      // Mark session complete
      await supabase
        .from("text_to_apply_sessions")
        .update({ completed: true, candidate_id: candidate?.id, updated_at: new Date().toISOString() })
        .eq("id", session.id);

      return `🎉 Got it, ${responses.name}! Your application for ${role} is submitted.\n\nWe'll review and text you within 24 hours. Good luck! 📱\n—Vertex Hire`;
    }

    default:
      return "Thanks for your interest! Text APPLY to start a new application. 📱";
  }
}
