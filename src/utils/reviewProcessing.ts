
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { parseISO, isValid, subDays } from "date-fns";

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
          // Handle createTime processing
          let createTime = processDateTime(review.createTime);
          
          // Handle reply time processing if present
          let replyCreateTime = review.reviewReply?.createTime ? 
            processDateTime(review.reviewReply.createTime) : undefined;
          
          return {
            id: review.reviewId,
            authorName: review.reviewer.displayName,
            rating: review.starRating,
            comment: review.comment,
            createTime: createTime,
            photoUrls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || [],
            reply: review.reviewReply ? {
              comment: review.reviewReply.comment,
              createTime: replyCreateTime
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

/**
 * Process a datetime string from the Google API
 * Handles potential relative dates (though Google actually sends ISO strings)
 * and ensures we always return a valid ISO date string
 */
function processDateTime(dateTimeString: string): string {
  // Log the original date string for debugging
  console.log("Processing date string:", dateTimeString);
  
  try {
    // Check if it's already a valid ISO string
    const parsedDate = parseISO(dateTimeString);
    if (isValid(parsedDate)) {
      return parsedDate.toISOString();
    }
    
    // Handle potential "X weeks ago" format (though Google API shouldn't send this)
    // This is just a fallback in case the format changes in the future
    if (dateTimeString.includes('weeks ago')) {
      const weeksMatch = dateTimeString.match(/(\d+)\s*weeks?\s*ago/i);
      if (weeksMatch && weeksMatch[1]) {
        const weeksAgo = parseInt(weeksMatch[1], 10);
        const date = subDays(new Date(), weeksAgo * 7);
        return date.toISOString();
      }
    }
    
    // Handle other relative date formats as needed
    if (dateTimeString.includes('days ago')) {
      const daysMatch = dateTimeString.match(/(\d+)\s*days?\s*ago/i);
      if (daysMatch && daysMatch[1]) {
        const daysAgo = parseInt(daysMatch[1], 10);
        const date = subDays(new Date(), daysAgo);
        return date.toISOString();
      }
    }
    
    // If we couldn't parse it, use current time as fallback
    console.warn("Unparseable date format, using current time:", dateTimeString);
    return new Date().toISOString();
  } catch (e) {
    console.error("Error processing date:", dateTimeString, e);
    // If any error occurs during parsing, use current time as fallback
    return new Date().toISOString();
  }
}
