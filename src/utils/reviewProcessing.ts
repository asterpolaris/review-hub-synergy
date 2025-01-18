import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { Json } from "@/integrations/supabase/types";

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
    const businessIds = reviewsData.businesses
      .filter(b => b.id)
      .map(b => b.id);
    
    if (!businessIds.length) {
      console.log("No valid business IDs found");
      return { reviews: [], errors };
    }

    console.log("Fetching cached reviews for business IDs:", businessIds);

    const { data: cachedReviews, error: cacheError } = await supabase
      .from('cached_reviews')
      .select('review_data, business_id, google_review_id')
      .in('business_id', businessIds);

    if (cacheError) {
      console.error("Error fetching cached reviews:", cacheError);
      throw cacheError;
    }

    const existingReviews = new Map(
      cachedReviews?.map(review => [
        `${review.business_id}-${review.google_review_id}`,
        review
      ]) || []
    );

    if (cachedReviews && cachedReviews.length > 0) {
      console.log("Found cached reviews:", cachedReviews);
      
      cachedReviews.forEach(cached => {
        const business = reviewsData.businesses.find(b => b.id === cached.business_id);
        if (business && cached.review_data) {
          const reviewData = cached.review_data as unknown as Review;
          allReviews.push({
            ...reviewData,
            venueName: business.name,
            placeId: business.google_place_id,
          });
        }
      });
    }

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
      await processLocationReviews(batchResponse.locationReviews, reviewsData.businesses, existingReviews, allReviews, errors);
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

const processLocationReviews = async (
  locationReviews: any[],
  businesses: Business[],
  existingReviews: Map<string, any>,
  allReviews: Review[],
  errors: string[]
) => {
  for (const locationReview of locationReviews) {
    const business = businesses.find(
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

        const reviewKey = `${business.id}-${review.reviewId}`;
        const existingReview = existingReviews.get(reviewKey);

        try {
          await updateReviewCache(business.id, review.reviewId, reviewData, existingReview, errors);
        } catch (error) {
          console.error("Error processing review:", error);
          errors.push(`Error processing review ${review.reviewId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  }
};

const updateReviewCache = async (
  businessId: string,
  reviewId: string,
  reviewData: Review,
  existingReview: any,
  errors: string[]
) => {
  if (!existingReview) {
    console.log("Inserting new cached review:", {
      business_id: businessId,
      google_review_id: reviewId,
      review_data: reviewData
    });

    const { error: insertError } = await supabase
      .from('cached_reviews')
      .insert({
        business_id: businessId,
        google_review_id: reviewId,
        review_data: reviewData as unknown as Json,
      });

    if (insertError) {
      console.error("Failed to insert cached review:", insertError);
      errors.push(`Failed to insert review ${reviewId}: ${insertError.message}`);
    }
  } else {
    console.log("Updating existing cached review:", `${businessId}-${reviewId}`);
    const { error: updateError } = await supabase
      .from('cached_reviews')
      .update({
        review_data: reviewData as unknown as Json,
      })
      .match({ 
        business_id: businessId,
        google_review_id: reviewId 
      });

    if (updateError) {
      console.error("Failed to update cached review:", updateError);
      errors.push(`Failed to update review ${reviewId}: ${updateError.message}`);
    }
  }
};