import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";

interface Business {
  id: string;
  name: string;
  google_place_id: string;
}

interface ReviewsData {
  access_token: string;
  businesses: Business[];
}

export const processReviewData = async (reviewsData: ReviewsData) => {
  const allReviews: Review[] = [];
  const errors: string[] = [];

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("No valid session found:", sessionError);
      throw new Error("Authentication required");
    }

    const { data: batchResponse, error: batchError } = await supabase.functions.invoke('reviews-batch', {
      body: {
        access_token: reviewsData.access_token,
        location_names: reviewsData.businesses.map(b => b.google_place_id),
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (batchError) {
      console.error("Failed to fetch reviews batch:", batchError);
      throw batchError;
    }

    if (batchResponse?.locationReviews) {
      for (const locationReview of batchResponse.locationReviews) {
        const business = reviewsData.businesses.find(
          b => b.google_place_id === locationReview.locationName
        );
        
        if (business && locationReview.reviews) {
          for (const review of locationReview.reviews) {
            const reviewData: Review = {
              id: review.reviewId,
              authorName: review.reviewer.displayName,
              rating: review.starRating,
              comment: review.comment,
              createTime: review.createTime,
              reply: review.reviewReply ? {
                comment: review.reviewReply.comment,
                createTime: review.reviewReply.updateTime
              } : undefined,
              photoUrls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || [],
              venueName: business.name,
              placeId: business.google_place_id,
            };

            allReviews.push(reviewData);
          }
        }
      }
    }

  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    errors.push(`Reviews request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const uniqueReviews = Array.from(
    new Map(allReviews.map(review => [review.id, review])).values()
  ).sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

  return { reviews: uniqueReviews, errors };
};