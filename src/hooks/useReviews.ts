import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";
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

export const useReviews = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      console.log("Fetching reviews data...");
      
      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews') as { 
        data: ReviewsData | null;
        error: Error | null;
      };
      
      if (reviewsError) {
        console.error("Error fetching reviews data:", reviewsError);
        throw reviewsError;
      }

      if (!reviewsData) {
        throw new Error("No data returned from reviews function");
      }

      if (!reviewsData.businesses || reviewsData.businesses.length === 0) {
        return { reviews: [], businesses: [] };
      }

      console.log("Reviews data received:", reviewsData);

      const allReviews: Review[] = [];
      const errors: string[] = [];

      try {
        // Get all cached reviews in one query
        const businessIds = reviewsData.businesses.map(b => b.id);
        const { data: cachedReviews, error: cacheError } = await supabase
          .from('cached_reviews')
          .select('review_data, business_id, google_review_id')
          .in('business_id', businessIds);

        if (cacheError) {
          console.error("Error fetching cached reviews:", cacheError);
          throw cacheError;
        }

        // Create a map of existing reviews for quick lookup
        const existingReviews = new Map(
          cachedReviews?.map(review => [
            `${review.business_id}-${review.google_review_id}`,
            review
          ]) || []
        );

        if (cachedReviews) {
          console.log("Found cached reviews:", cachedReviews);
          
          // Process cached reviews
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

        // Fetch fresh reviews from Google API
        const { data: batchResponse, error: batchError } = await supabase.functions.invoke('reviews-batch', {
          body: {
            access_token: reviewsData.access_token,
            location_names: reviewsData.businesses.map(b => b.google_place_id),
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

                const reviewKey = `${business.id}-${review.reviewId}`;
                const existingReview = existingReviews.get(reviewKey);

                try {
                  if (existingReview) {
                    // Update existing review
                    const { error: updateError } = await supabase
                      .from('cached_reviews')
                      .update({
                        review_data: reviewData as unknown as Json,
                      })
                      .match({ 
                        business_id: business.id,
                        google_review_id: review.reviewId 
                      });

                    if (updateError) {
                      console.error("Failed to update cached review:", updateError);
                      errors.push(`Failed to update review ${review.reviewId}: ${updateError.message}`);
                    }
                  } else {
                    // Insert new review
                    const { error: insertError } = await supabase
                      .from('cached_reviews')
                      .insert({
                        business_id: business.id,
                        google_review_id: review.reviewId,
                        review_data: reviewData as unknown as Json,
                      });

                    if (insertError) {
                      console.error("Failed to insert cached review:", insertError);
                      errors.push(`Failed to insert review ${review.reviewId}: ${insertError.message}`);
                    }
                  }
                } catch (error) {
                  console.error("Error processing review:", error);
                  errors.push(`Error processing review ${review.reviewId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
              }
            }
          }
        }

      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        errors.push(`Reviews request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      if (errors.length > 0) {
        toast({
          title: "Some reviews failed to load",
          description: errors.join('\n'),
          variant: "destructive",
        });
      }

      // Remove duplicates and sort
      const uniqueReviews = Array.from(
        new Map(allReviews.map(review => [review.id, review])).values()
      ).sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());

      return {
        reviews: uniqueReviews,
        businesses: reviewsData.businesses
      };
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
  });
};