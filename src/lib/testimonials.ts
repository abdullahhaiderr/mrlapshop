import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { customerVideoReviews } from "@/config/customer-video-reviews";
import { getYouTubeVideoId } from "@/lib/youtube";

export type PublicVideoTestimonial = {
  id: string;
  displayName: string;
  headline: string;
  reviewText: string | null;
  rating: number | null;
  youtubeUrl: string;
  videoId: string;
  publishedAt: string | null;
};

function configuredFallback(): PublicVideoTestimonial[] {
  return customerVideoReviews.flatMap((item, index) => {
    const videoId = getYouTubeVideoId(item.youtubeUrl);
    if (!videoId) return [];
    return [{
      id: `configured-${videoId}-${index}`,
      displayName: "Mr LapShop customer",
      headline: item.title?.trim() || "Customer experience",
      reviewText: item.caption ?? null,
      rating: null,
      youtubeUrl: item.youtubeUrl,
      videoId,
      publishedAt: null,
    }];
  });
}

/**
 * Only consented, published records are returned to the public storefront.
 * Admin moderation and writes remain protected by requireStoreOwner() + RLS.
 */
export async function getPublicVideoTestimonials(): Promise<PublicVideoTestimonial[]> {
  if (!isSupabaseConfigured()) return configuredFallback();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customer_testimonials")
      .select("id, display_name, headline, review_text, rating, youtube_url, consent_to_publish, status, published_at")
      .eq("status", "published")
      .eq("consent_to_publish", true)
      .not("youtube_url", "is", null)
      .order("published_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    return (data ?? []).flatMap((row) => {
      if (!row.youtube_url) return [];
      const videoId = getYouTubeVideoId(row.youtube_url);
      if (!videoId) return [];
      return [{
        id: row.id,
        displayName: row.display_name,
        headline: row.headline,
        reviewText: row.review_text,
        rating: row.rating,
        youtubeUrl: row.youtube_url,
        videoId,
        publishedAt: row.published_at,
      }];
    });
  } catch {
    // Keep the storefront resilient during a temporary Supabase outage.
    return configuredFallback();
  }
}
