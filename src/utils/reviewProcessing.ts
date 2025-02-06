import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";

interface ReviewsData {
  access_token: string;
  businesses: Array<{
    id: string;
    name: string;
    google_place_id: string;
    venue_name: string;
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found');
    }

    // Fetch reviews from Google API via Edge Function
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

    console.log("Reviews response from Edge Function:", reviewsResponse);

    if (!reviewsResponse.locationReviews) {
      console.error("Unexpected response structure:", reviewsResponse);
      errors.push("Unexpected response structure from API");
      return { reviews, errors };
    }

    // Process and cache reviews
    for (const locationReview of reviewsResponse.locationReviews) {
      const business = reviewsData.businesses.find(b => 
        b.google_place_id === locationReview.locationName
      );

      if (!business) continue;

      if (locationReview.reviews) {
        const processedReviews = await Promise.all(locationReview.reviews.map(async (review: any) => {
          // Cache the review in the database
          const { error: upsertError } = await supabase
            .from('reviews')
            .upsert({
              google_review_id: review.reviewId,
              business_id: business.id,
              author_name: review.reviewer.displayName,
              rating: review.starRating,
              comment: review.comment,
              create_time: review.createTime,
              reply: review.reviewReply?.comment,
              reply_time: review.reviewReply?.createTime,
              photo_urls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || [],
              status: review.reviewReply ? 'replied' : 'pending'
            }, {
              onConflict: 'google_review_id'
            });

          if (upsertError) {
            console.error("Error caching review:", upsertError);
            errors.push(`Failed to cache review: ${upsertError.message}`);
          }

          return {
            id: review.reviewId,
            googleReviewId: review.reviewId,
            authorName: review.reviewer.displayName,
            rating: review.starRating,
            comment: review.comment,
            createTime: review.createTime,
            photoUrls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || [],
            reply: review.reviewReply ? {
              comment: review.reviewReply.comment,
              createTime: review.reviewReply.createTime
            } : undefined,
            venueName: business.venue_name || 'Unknown Venue',
            placeId: locationReview.locationName,
            status: review.reviewReply ? 'replied' : 'pending'
          };
        }));

        reviews.push(...processedReviews);
      }
    }

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