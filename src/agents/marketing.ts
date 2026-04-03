import { BaseAgent, AgentEvent } from "./base-agent";

/**
 * Marketing Manager Agent
 * - Creates and schedules campaigns
 * - Suggests slow-day promotions
 * - Generates AI social posts
 * - Tracks campaign analytics
 */
export class MarketingAgent extends BaseAgent {
  constructor() {
    super("marketing");
  }

  async check(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get all locations
    const { data: locations } = await this.supabase.from("locations").select("id, name, phone, email");

    for (const loc of locations || []) {
      // Check slow days and suggest promotions
      await this.analyzeSlowDays(loc.id, events);

      // Check scheduled campaigns that need to go live
      await this.activateScheduledCampaigns(loc.id, events);

      // Check expired promotions
      await this.expireOldPromotions(loc.id, events);
    }

    return events;
  }

  private async analyzeSlowDays(locationId: string, events: AgentEvent[]): Promise<void> {
    // Get orders from last 30 days to find slow days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders } = await this.supabase
      .from("orders")
      .select("created_at, total")
      .eq("location_id", locationId)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (!orders || orders.length < 10) return; // Need enough data

    // Group by day of week (0 = Sunday)
    const dayStats: Record<number, { count: number; revenue: number }> = {};
    for (let i = 0; i < 7; i++) dayStats[i] = { count: 0, revenue: 0 };

    for (const order of orders) {
      const day = new Date(order.created_at).getDay();
      dayStats[day].count++;
      dayStats[day].revenue += Number(order.total || 0);
    }

    // Find slowest day
    const avgPerDay = orders.length / 7;
    let slowDay: number | null = null;
    let minRatio = 1;

    for (const [day, stats] of Object.entries(dayStats)) {
      const ratio = stats.count / avgPerDay;
      if (ratio < minRatio && stats.count >= 3) {
        minRatio = ratio;
        slowDay = parseInt(day);
      }
    }

    if (slowDay !== null && minRatio < 0.7) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      // Check if we already have an active promotion for this day
      const { data: existingPromo } = await this.supabase
        .from("promotions")
        .select("id")
        .eq("location_id", locationId)
        .eq("day_of_week", slowDay)
        .eq("status", "active");

      if (!existingPromo || existingPromo.length === 0) {
        // Log suggestion
        const event = await this.logEvent({
          agent_type: "marketing",
          event_type: "slow_day_detected",
          location_id: locationId,
          severity: "info",
          description: `${dayNames[slowDay]} is the slowest day (${(minRatio * 100).toFixed(0)}% of average). Suggest creating a promotion.`,
          metadata: { day_of_week: slowDay, day_name: dayNames[slowDay], ratio: minRatio },
        });
        events.push(event);

        // Notify manager
        const loc = await this.supabase.from("locations").select("name, phone, email").eq("id", locationId).single();
        if (loc.data) {
          await this.notify(
            "info",
            { name: "Manager", phone: loc.data.phone, email: loc.data.email },
            `📢 Slow day detected: ${dayNames[slowDay]} is at ${(minRatio * 100).toFixed(0)}% of average. Consider a promotion!`,
            "Marketing Suggestion — Slow Day Promotion",
            `<p>We analyzed your sales data and found that <strong>${dayNames[slowDay]}</strong> is your slowest day.</p><p>Would you like us to create a promotional offer to boost traffic?</p>`,
            event.id,
            locationId
          );
        }
      }
    }
  }

  private async activateScheduledCampaigns(locationId: string, events: AgentEvent[]): Promise<void> {
    const now = new Date();

    // Find campaigns scheduled to go live now
    const { data: toActivate } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("location_id", locationId)
      .eq("status", "scheduled")
      .lte("scheduled_at", now.toISOString());

    if (toActivate && toActivate.length > 0) {
      for (const campaign of toActivate) {
        await this.supabase
          .from("campaigns")
          .update({ status: "active", started_at: now.toISOString() })
          .eq("id", campaign.id);

        const event = await this.logEvent({
          agent_type: "marketing",
          event_type: "campaign_activated",
          location_id: locationId,
          severity: "info",
          description: `Campaign "${campaign.name}" is now live`,
          metadata: { campaign_id: campaign.id, channel: campaign.channel },
        });
        events.push(event);
      }
    }
  }

  private async expireOldPromotions(locationId: string, events: AgentEvent[]): Promise<void> {
    const now = new Date();

    // Find expired promotions
    const { data: expired } = await this.supabase
      .from("promotions")
      .select("*")
      .eq("location_id", locationId)
      .eq("status", "active")
      .lt("valid_until", now.toISOString());

    if (expired && expired.length > 0) {
      for (const promo of expired) {
        await this.supabase
          .from("promotions")
          .update({ status: "expired" })
          .eq("id", promo.id);

        const event = await this.logEvent({
          agent_type: "marketing",
          event_type: "promotion_expired",
          location_id: locationId,
          severity: "info",
          description: `Promotion "${promo.name}" has expired`,
          metadata: { promotion_id: promo.id, promo_code: promo.promo_code },
        });
        events.push(event);
      }
    }
  }

  // === API Methods ===

  async createCampaign(data: {
    location_id: string;
    name: string;
    type: "social" | "email" | "sms" | "promo" | "event";
    content: string;
    channel: "facebook" | "instagram" | "twitter" | "email" | "sms";
    scheduled_at?: string;
    budget?: number;
  }): Promise<string> {
    const { data: campaign, error } = await this.supabase
      .from("campaigns")
      .insert({
        location_id: data.location_id,
        name: data.name,
        type: data.type,
        content: data.content,
        channel: data.channel,
        status: data.scheduled_at ? "scheduled" : "draft",
        scheduled_at: data.scheduled_at || null,
        budget: data.budget || null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return campaign?.id || "";
  }

  async createPromotion(data: {
    location_id: string;
    name: string;
    description?: string;
    discount_type: "percentage" | "fixed" | "bogo" | "free_item";
    discount_value: number;
    promo_code?: string;
    valid_from?: string;
    valid_until?: string;
    day_of_week?: number;
    max_redemptions?: number;
  }): Promise<string> {
    const { data: promo, error } = await this.supabase
      .from("promotions")
      .insert({
        location_id: data.location_id,
        name: data.name,
        description: data.description,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        promo_code: data.promo_code,
        valid_from: data.valid_from || new Date().toISOString(),
        valid_until: data.valid_until,
        day_of_week: data.day_of_week,
        max_redemptions: data.max_redemptions,
      })
      .select("id")
      .single();

    if (error) throw error;
    return promo?.id || "";
  }

  async addCustomer(data: {
    location_id: string;
    name: string;
    email?: string;
    phone?: string;
    tags?: string[];
  }): Promise<string> {
    const { data: customer, error } = await this.supabase
      .from("customer_list")
      .insert({
        location_id: data.location_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        tags: data.tags || [],
      })
      .select("id")
      .single();

    if (error) throw error;
    return customer?.id || "";
  }

  async generateSocialPost(
    channel: "facebook" | "instagram" | "twitter",
    content_type: "promo" | "event" | "general" = "general"
  ): Promise<string> {
    // Simple template-based generation
    const templates: Record<string, Record<string, string>> = {
      facebook: {
        promo: "🔥 Limited time offer! Come in and enjoy our amazing deals. Click to learn more!",
        event: "🎉 You're invited! Join us for an unforgettable experience. Details inside!",
        general: "We'd like to thank our amazing customers! Stay tuned for more updates.",
      },
      instagram: {
        promo: "🔥 Limited time! Don't miss out 💫",
        event: "🎉 Save the date! ✨",
        general: "Thank you for your continued support 💜",
      },
      twitter: {
        promo: "🔥 Limited time offer! Check it out: ",
        event: "🎉 Coming soon! ",
        general: "Thanks for your support! ",
      },
    };

    return templates[channel][content_type] || templates[channel].general;
  }

  async getCampaignAnalytics(locationId: string, startDate: string, endDate: string) {
    const { data: campaigns } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("location_id", locationId)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });

    const totals = {
      total_campaigns: campaigns?.length || 0,
      total_reach: campaigns?.reduce((s, c) => s + (c.reach || 0), 0) || 0,
      total_engagement: campaigns?.reduce((s, c) => s + (c.engagement || 0), 0) || 0,
      total_conversions: campaigns?.reduce((s, c) => s + (c.conversions || 0), 0) || 0,
      active_campaigns: campaigns?.filter(c => c.status === "active").length || 0,
    };

    return { campaigns: campaigns || [], totals };
  }
}

export const marketingAgent = new MarketingAgent();
