import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";

interface ReviewsData {
  access_token: string;
  businesses: Array<{
    id: string;
    name: string;
    google_place_id: string;
  }>;
}

export const processReviewData = async (reviewsData: ReviewsData): Promise<{ reviews: Review[], errors: string[] }> => {
  const errors: string[] = [];
  const reviews: Review[] = [];

  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found');
    }

    // Fetch reviews directly from Google API via Edge Function
    const { data: reviewsResponse, error: reviewsError } = await supabase.functions.invoke('reviews-batch', {
      body: {
        access_token: reviewsData.access_token,
        location_names: reviewsData.businesses.map(b => b.google_place_id)
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      errors.push(`Failed to fetch reviews: ${reviewsError.message}`);
      return { reviews, errors };
    }

    if (!reviewsResponse) {
      errors.push("No reviews data received from API");
      return { reviews, errors };
    }

    // Process the reviews from the response
    const processedReviews = reviewsResponse.reviews.map((review: any) => ({
      id: review.reviewId,
      authorName: review.reviewer.displayName,
      rating: review.starRating,
      comment: review.comment,
      createTime: review.createTime,
      photoUrls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || [],
      reply: review.reviewReply ? {
        comment: review.reviewReply.comment,
        createTime: review.reviewReply.createTime
      } : undefined,
      venueName: reviewsData.businesses.find(b => 
        b.google_place_id === review.placeId
      )?.name || 'Unknown Venue',
      placeId: review.placeId
    }));

    reviews.push(...processedReviews);

  } catch (error) {
    console.error("Error processing reviews:", error);
    errors.push(`Failed to process reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { reviews, errors };
};