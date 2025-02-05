
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

export const processReviewData = async (
  reviewsData: ReviewsData, 
  pageToken?: string | null
): Promise<{ 
  reviews: Review[]; 
  nextPageToken?: string;
  errors: string[]; 
}> => {
  const errors: string[] = [];
  const reviews: Review[] = [];
  let nextPageToken: string | undefined;

  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found');
    }

    // Fetch reviews directly from Google API via Edge Function
    const { data, error: reviewsError } = await supabase.functions.invoke('reviews-batch', {
      body: {
        access_token: reviewsData.access_token,
        location_names: reviewsData.businesses.map(b => b.google_place_id),
        pageToken
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

    if (!data) {
      errors.push("No reviews data received from API");
      return { reviews, errors };
    }

    // Add debug logging
    console.log("Reviews response from Edge Function:", data);

    // Check if data has the expected structure
    if (!data.locationReviews) {
      console.error("Unexpected response structure:", data);
      errors.push("Unexpected response structure from API");
      return { reviews, errors };
    }

    // Process the reviews from the response
    data.locationReviews.forEach((locationReview: any) => {
      if (locationReview.reviews) {
        const processedReviews = locationReview.reviews.map((review: any) => ({
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
            b.google_place_id === locationReview.locationName
          )?.name || 'Unknown Venue',
          placeId: locationReview.locationName
        }));

        reviews.push(...processedReviews);
      }
    });

    // Get the next page token from the response
    nextPageToken = data.nextPageToken;

  } catch (error) {
    console.error("Error processing reviews:", error);
    errors.push(`Failed to process reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log("Final reviews count:", reviews.length);
  return { 
    reviews, 
    errors,
    nextPageToken
  };
};
