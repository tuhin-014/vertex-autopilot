import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/reviews — List reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const sentiment = searchParams.get("sentiment");
    const rating = searchParams.get("rating");
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = createServiceClient();

    let query = supabase
      .from("reviews")
      .select("*, locations(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (locationId) query = query.eq("location_id", locationId);
    if (sentiment) query = query.eq("sentiment", sentiment);
    if (rating) query = query.eq("rating", parseInt(rating));

    const { data, error } = await query;

    if (error) throw error;

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      avgRating: data?.length ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0,
      positive: data?.filter(r => r.sentiment === "positive").length || 0,
      neutral: data?.filter(r => r.sentiment === "neutral").length || 0,
      negative: data?.filter(r => r.sentiment === "negative").length || 0,
      responded: data?.filter(r => r.response_sent).length || 0,
    };

    return NextResponse.json({ reviews: data || [], stats });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews — Create review (manual entry or from API)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const reviewData = {
      location_id: body.location_id,
      platform: body.platform || "manual",
      reviewer_name: body.reviewer_name,
      rating: body.rating,
      review_text: body.review_text,
      sentiment: body.sentiment,
      topics: body.topics || [],
      review_date: body.review_date || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert(reviewData)
      .select("*, locations(name)")
      .single();

    if (error) throw error;

    // Analyze sentiment if not provided
    if (!reviewData.sentiment && body.review_text) {
      const sentiment = analyzeSentiment(body.review_text);
      const topics = extractTopics(body.review_text);

      const { data: updated } = await supabase
        .from("reviews")
        .update({ sentiment, topics })
        .eq("id", data.id)
        .select()
        .single();

      return NextResponse.json({ review: updated });
    }

    return NextResponse.json({ review: data });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

// Simple sentiment analysis
function analyzeSentiment(text: string): string {
  const lower = text.toLowerCase();
  const negativeWords = ["bad", "terrible", "awful", "horrible", "worst", "disappointed", "rude", "cold", "slow", "dirty", "gross"];
  const positiveWords = ["great", "amazing", "excellent", "wonderful", "best", "love", "friendly", "fresh", "clean", "perfect"];

  const negScore = negativeWords.filter(w => lower.includes(w)).length;
  const posScore = positiveWords.filter(w => lower.includes(w)).length;

  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("food") || lower.includes("taste") || lower.includes("flavor")) topics.push("food");
  if (lower.includes("service") || lower.includes("staff") || lower.includes("rude") || lower.includes("friendly")) topics.push("service");
  if (lower.includes("clean") || lower.includes("dirty") || lower.includes("bathroom")) topics.push("cleanliness");
  if (lower.includes("wait") || lower.includes("long") || lower.includes("slow")) topics.push("wait_time");
  if (lower.includes("price") || lower.includes("expensive") || lower.includes("cheap")) topics.push("price");
  if (lower.includes("ambiance") || lower.includes("music") || lower.includes("atmosphere")) topics.push("ambiance");

  return topics;
}
