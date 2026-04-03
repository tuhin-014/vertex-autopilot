import { BaseAgent, AgentEvent } from "./base-agent";

/**
 * Review Manager Agent
 * - Monitors for new 1-2 star reviews
 * - Generates AI responses
 * - Tracks sentiment trends
 * - Alerts on negative reviews
 */
export class ReviewAgent extends BaseAgent {
  constructor() {
    super("review");
  }

  async check(): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Get locations
    const { data: locations } = await this.supabase.from("locations").select("id, name, phone, email");

    for (const loc of locations || []) {
      // Check for recent 1-2 star reviews that haven't been responded to
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 1);

      const { data: recentReviews } = await this.supabase
        .from("reviews")
        .select("*")
        .eq("location_id", loc.id)
        .lte("rating", 2)
        .eq("response_sent", false)
        .gte("created_at", dayAgo.toISOString());

      if (recentReviews && recentReviews.length > 0) {
        for (const review of recentReviews) {
          // Analyze sentiment and extract topics
          const sentiment = this.analyzeSentiment(review.review_text || "");
          const topics = this.extractTopics(review.review_text || "");

          // Update review with AI analysis
          await this.supabase
            .from("reviews")
            .update({ sentiment, topics })
            .eq("id", review.id);

          // Generate AI response
          const aiResponse = this.generateResponse(sentiment, review.review_text || "");

          // Log event
          const event = await this.logEvent({
            agent_type: "review",
            event_type: "negative_review_alert",
            location_id: loc.id,
            severity: "warning",
            description: `New ${review.rating}-star review from ${review.reviewer_name || "Anonymous"}: "${(review.review_text || "").slice(0, 50)}..."`,
            action_taken: "Generated AI response and queued for review",
            metadata: { review_id: review.id, sentiment, topics, ai_response: aiResponse },
          });

          // Update review with AI response
          await this.supabase
            .from("reviews")
            .update({ ai_response: aiResponse })
            .eq("id", review.id);

          // Notify manager
          await this.notify(
            "warning",
            { name: "Manager", phone: loc.phone, email: loc.email },
            `⚠️ New ${review.rating}-star review needs attention: "${(review.review_text || "").slice(0, 30)}..."`,
            `Review Alert — ${loc.name}`,
            `<p>A new ${review.rating}-star review requires your attention.</p><p><em>"${review.review_text}"</em></p><p><strong>Sentiment:</strong> ${sentiment}</p><p><strong>AI Response:</strong> ${aiResponse}</p>`,
            event.id,
            loc.id
          );

          events.push({
            agent_type: "review",
            event_type: "negative_review_alert",
            location_id: loc.id,
            severity: "warning",
            description: `Alerted for ${review.rating}-star review from ${review.reviewer_name || "Anonymous"}`,
            metadata: { review_id: review.id },
          });
        }
      }

      // Weekly sentiment report
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weekReviews } = await this.supabase
        .from("reviews")
        .select("rating, sentiment")
        .eq("location_id", loc.id)
        .gte("created_at", weekAgo.toISOString());

      if (weekReviews && weekReviews.length > 0) {
        const avgRating = weekReviews.reduce((s, r) => s + r.rating, 0) / weekReviews.length;
        const negCount = weekReviews.filter(r => r.rating <= 2).length;

        if (avgRating < 3.5) {
          const event = await this.logEvent({
            agent_type: "review",
            event_type: "sentiment_trend",
            location_id: loc.id,
            severity: "info",
            description: `Weekly avg rating: ${avgRating.toFixed(1)}⭐ (${weekReviews.length} reviews)`,
            metadata: { avg_rating: avgRating, review_count: weekReviews.length, negative_count: negCount },
          });
          events.push(event);
        }
      }
    }

    return events;
  }

  private analyzeSentiment(text: string): string {
    const lower = text.toLowerCase();
    const negativeWords = ["bad", "terrible", "awful", "horrible", "worst", "disappointed", "rude", "cold", "slow", "dirty", "gross"];
    const positiveWords = ["great", "amazing", "excellent", "wonderful", "best", "love", "friendly", "fresh", "clean", "perfect"];

    const negScore = negativeWords.filter(w => lower.includes(w)).length;
    const posScore = positiveWords.filter(w => lower.includes(w)).length;

    if (posScore > negScore) return "positive";
    if (negScore > posScore) return "negative";
    return "neutral";
  }

  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const lower = text.toLowerCase();

    if (lower.includes("food") || lower.includes("taste") || lower.includes("flavor") || lower.includes("burger") || lower.includes("fries")) topics.push("food");
    if (lower.includes("service") || lower.includes("staff") || lower.includes("rude") || lower.includes("friendly") || lower.includes("wait")) topics.push("service");
    if (lower.includes("clean") || lower.includes("dirty") || lower.includes("bathroom") || lower.includes("mess")) topics.push("cleanliness");
    if (lower.includes("wait") || lower.includes("long") || lower.includes("slow") || lower.includes("fast")) topics.push("wait_time");
    if (lower.includes("price") || lower.includes("expensive") || lower.includes("cheap") || lower.includes("cost")) topics.push("price");
    if (lower.includes("ambiance") || lower.includes("music") || lower.includes("atmosphere") || lower.includes("environment")) topics.push("ambiance");

    return topics;
  }

  private generateResponse(sentiment: string, reviewText: string): string {
    // Get default template for sentiment
    return `Thank you for your feedback. We appreciate you taking the time to share your thoughts and are always looking to improve our service.`;
  }

  async generateAIResponse(reviewId: string, customTone?: string): Promise<string> {
    const { data: review } = await this.supabase
      .from("reviews")
      .select("*, locations(name)")
      .eq("id", reviewId)
      .single();

    if (!review) return "";

    const tone = customTone || (review.sentiment === "negative" ? "apologetic" : "grateful");
    const locationName = (review.locations as any)?.name || "our restaurant";

    // Simple template-based response (could integrate with LLM for more sophisticated responses)
    if (review.sentiment === "negative") {
      return `We sincerely apologize for your recent experience at ${locationName}. This is not the standard we strive for. Please contact us directly at your earliest convenience so we can address your concerns and make things right. We value your feedback and would like to earn another chance to serve you better.`;
    } else if (review.sentiment === "positive") {
      return `Thank you so much for the wonderful review of ${locationName}! We're thrilled to hear you had a great experience with us. Our team works hard to deliver excellent food and service, and your kind words motivate us to keep striving for excellence. We look forward to seeing you again soon!`;
    } else {
      return `Thank you for your feedback about ${locationName}. We appreciate you taking the time to share your thoughts and are always looking for ways to improve. If there's anything specific we could do better, please let us know!`;
    }
  }
}

export const reviewAgent = new ReviewAgent();
