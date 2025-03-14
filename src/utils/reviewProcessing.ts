
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { parseISO, isValid } from "date-fns";

interface ReviewsData {
  access_token: string;
  businesses: Array<{
    id: string;
    name: string;
    google_place_id: string;
  }>;
}

interface PageTokens {
  [key: string]: string;
}

export const processReviewData = async (
  reviewsData: ReviewsData, 
  pageTokens?: PageTokens
): Promise<{ 
  reviews: Review[], 
  errors: string[],
  nextPageTokens?: PageTokens 
}> => {
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
        location_names: reviewsData.businesses.map(b => b.google_place_id),
        page_tokens: pageTokens
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

    // Add debug logging
    console.log("Reviews response from Edge Function:", reviewsResponse);

    // Check if reviewsResponse has the expected structure
    if (!reviewsResponse.locationReviews) {
      console.error("Unexpected response structure:", reviewsResponse);
      errors.push("Unexpected response structure from API");
      return { reviews, errors };
    }

    // Process the reviews from the response
    reviewsResponse.locationReviews.forEach((locationReview: any) => {
      if (locationReview.reviews) {
        const processedReviews = locationReview.reviews.map((review: any) => {
          // Ensure proper date handling for createTime
          let createTime = review.createTime;
          
          // Log date information for debugging
          console.log("Original review createTime:", createTime);
          
          // Make sure we have a valid ISO string
          try {
            // Validate the date by parsing it
            const parsedDate = parseISO(createTime);
            if (!isValid(parsedDate)) {
              console.warn("Invalid date format detected:", createTime);
              // If parsing fails, use current time as fallback
              createTime = new Date().toISOString();
            }
          } catch (e) {
            console.error("Error parsing date:", createTime, e);
            // If parsing fails, use current time as fallback
            createTime = new Date().toISOString();
          }
          
          return {
            id: review.reviewId,
            authorName: review.reviewer.displayName,
            rating: review.starRating,
            comment: review.comment,
            createTime: createTime,
            photoUrls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || [],
            reply: review.reviewReply ? {
              comment: review.reviewReply.comment,
              createTime: review.reviewReply.createTime
            } : undefined,
            venueName: reviewsData.businesses.find(b => 
              b.google_place_id === locationReview.locationName
            )?.name || 'Unknown Venue',
            placeId: locationReview.locationName
          };
        });

        reviews.push(...processedReviews);
      }
    });

    console.log("Final reviews count:", reviews.length);
    return { 
      reviews, 
      errors,
      nextPageTokens: reviewsResponse.nextPageTokens
    };

  } catch (error) {
    console.error("Error processing reviews:", error);
    errors.push(`Failed to process reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { reviews, errors };
  }
};
