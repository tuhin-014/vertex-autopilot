import { BaseAgent, AgentEvent } from "./base-agent";

export class RevenueOptimizer extends BaseAgent {
  constructor() {
    super("revenue_optimizer");
  }

  async check(): Promise<AgentEvent[]> {
    return [];
  }

  // ── Weather-Based Recommendations ──
  async checkWeatherImpact(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    try {
      // Fetch weather for Raleigh, NC (IHOP region)
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=35.78&longitude=-78.64&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=America/New_York&forecast_days=2");
      const weather = await res.json();

      if (!weather.daily) return events;

      const tomorrow = weather.daily;
      const tomorrowIdx = 1; // Index 1 = tomorrow
      const maxTemp = tomorrow.temperature_2m_max?.[tomorrowIdx];
      const precip = tomorrow.precipitation_sum?.[tomorrowIdx];
      const weatherCode = tomorrow.weathercode?.[tomorrowIdx];

      // Weather codes: 0=clear, 1-3=cloudy, 51-67=rain, 71-77=snow, 80-82=showers, 95-99=thunderstorm
      const isRainy = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 99);
      const isSnowy = weatherCode >= 71 && weatherCode <= 77;
      const isCold = maxTemp !== undefined && maxTemp < 40;
      const isHot = maxTemp !== undefined && maxTemp > 95;

      // Check if already alerted today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await this.supabase
        .from("agent_events")
        .select("id")
        .eq("event_type", "weather_recommendation")
        .gte("created_at", todayStart.toISOString())
        .single();
      if (existing) return events;

      let recommendation = "";
      let severity: "info" | "warning" = "info";

      if (isSnowy) {
        recommendation = `❄️ Snow forecasted tomorrow (${precip}mm). Expect lower dine-in, higher delivery. Push delivery/takeout promotions. Consider reduced staffing.`;
        severity = "warning";
      } else if (isRainy) {
        recommendation = `🌧️ Rain forecasted tomorrow (${precip}mm). Comfort food sells well — push soup/coffee specials. Delivery orders typically +20%.`;
      } else if (isCold) {
        recommendation = `🥶 Cold tomorrow (high: ${maxTemp}°F). Hot breakfast combos + coffee promotions. Expect comfort food demand.`;
      } else if (isHot) {
        recommendation = `🔥 Hot tomorrow (high: ${maxTemp}°F). Push iced drinks, lighter menu items. AC costs will be higher.`;
      } else {
        recommendation = `☀️ Normal weather tomorrow (high: ${maxTemp}°F). Standard operations.`;
      }

      // Only create events for notable weather
      if (!isRainy && !isSnowy && !isCold && !isHot) return events;

      const { data: locations } = await this.supabase.from("locations").select("id").limit(1);
      const locationId = locations?.[0]?.id;

      const event: AgentEvent = {
        agent_type: "revenue_optimizer",
        event_type: "weather_recommendation",
        location_id: locationId || "",
        severity,
        description: recommendation,
        action_taken: "Promotion recommendation sent to regional dashboard",
        metadata: { max_temp: maxTemp, precipitation: precip, weather_code: weatherCode },
      };

      await this.logEvent(event);
      events.push(event);
    } catch (err) {
      console.error("Weather check failed:", err);
    }

    return events;
  }

  // ── Day-of-Week Revenue Patterns ──
  async analyzeDayPatterns(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay();
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];

    // IHOP revenue patterns (typical)
    const patterns: Record<number, { trend: string; suggestion: string }> = {
      0: { trend: "🔥 High (Sunday brunch rush)", suggestion: "Full staff, push brunch specials, ensure pancake batter prepped by 6 AM" },
      1: { trend: "📉 Low (Monday dip)", suggestion: "Run BOGO or loyalty promotions, reduced evening staff OK" },
      2: { trend: "📊 Average", suggestion: "Standard operations, good day for staff training" },
      3: { trend: "📊 Average", suggestion: "Midweek — hump day promotions can lift traffic" },
      4: { trend: "📈 Above avg", suggestion: "Pre-weekend uptick, ensure inventory stocked for weekend rush" },
      5: { trend: "🔥 High (Friday dinner)", suggestion: "Full evening staff, push dinner combos, late-night menu ready" },
      6: { trend: "🔥 High (Saturday all-day)", suggestion: "All hands on deck, brunch + dinner rush, ensure supplies for 2-day weekend" },
    };

    const pattern = patterns[dayOfWeek] || patterns[2];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: existing } = await this.supabase
      .from("agent_events")
      .select("id")
      .eq("event_type", "day_pattern")
      .gte("created_at", todayStart.toISOString())
      .single();
    if (existing) return events;

    const { data: locations } = await this.supabase.from("locations").select("id").limit(1);

    const event: AgentEvent = {
      agent_type: "revenue_optimizer",
      event_type: "day_pattern",
      location_id: locations?.[0]?.id || "",
      severity: "info",
      description: `📅 Tomorrow is ${dayName} — ${pattern.trend}. ${pattern.suggestion}`,
      metadata: { day: dayName, day_of_week: dayOfWeek },
    };

    await this.logEvent(event);
    events.push(event);

    return events;
  }
}
