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
          .select('review_data, business_id')
          .in('business_id', businessIds);

        if (cacheError) {
          console.error("Error fetching cached reviews:", cacheError);
        } else if (cachedReviews) {
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
        const { data: batchResponse, error } = await supabase.functions.invoke('reviews-batch', {
          body: {
            access_token: reviewsData.access_token,
            location_names: reviewsData.businesses.map(b => b.google_place_id),
          }
        });

        if (error) {
          console.error("Failed to fetch reviews batch:", error);
          throw error;
        }

        if (batchResponse?.locationReviews) {
          // Prepare bulk upsert data
          const upsertData = [];
          
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

                // Add to reviews array
                allReviews.push(reviewData);

                // Prepare upsert data
                upsertData.push({
                  business_id: business.id,
                  google_review_id: review.reviewId,
                  review_data: reviewData as unknown as Json,
                });
              }
            }
          }

          // Bulk upsert all reviews at once
          if (upsertData.length > 0) {
            const { error: upsertError } = await supabase
              .from('cached_reviews')
              .upsert(upsertData, {
                onConflict: 'business_id,google_review_id'
              });

            if (upsertError) {
              console.error("Failed to cache reviews:", upsertError);
              errors.push(`Cache update failed: ${upsertError.message}`);
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
    cacheTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
  });
};