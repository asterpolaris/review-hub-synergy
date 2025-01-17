import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";

export const useReviews = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      console.log("Fetching business data...");
      
      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews') as { 
        data: { access_token: string; businesses: Array<{ name: string; google_place_id: string }> } | null;
        error: Error | null;
      };
      
      if (reviewsError) {
        console.error("Error fetching reviews data:", reviewsError);
        throw reviewsError;
      }

      if (!reviewsData) {
        throw new Error("No data returned from reviews function");
      }

      console.log("Business data received:", reviewsData);

      const allReviews: Review[] = [];
      const errors: string[] = [];

      try {
        // Call our Edge Function for batch reviews
        const { data: batchResponse, error } = await supabase.functions.invoke('reviews/batch', {
          body: {
            access_token: reviewsData.access_token,
            locationNames: reviewsData.businesses.map(b => b.google_place_id),
          }
        });

        if (error) {
          console.error("Failed to fetch reviews batch:", error);
          throw error;
        }

        console.log("Batch reviews response:", batchResponse);

        if (batchResponse?.locationReviews) {
          batchResponse.locationReviews.forEach((locationReview: any) => {
            const business = reviewsData.businesses.find(
              b => b.google_place_id === locationReview.locationName
            );
            
            if (business && locationReview.reviews) {
              locationReview.reviews.forEach((review: any) => {
                allReviews.push({
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
                });
              });
            }
          });
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

      // Even if there are no reviews, return an empty array with the business data
      return {
        reviews: allReviews.sort((a, b) => 
          new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
        ),
        businesses: reviewsData.businesses.map(b => ({
          name: b.name,
          id: b.google_place_id
        }))
      };
    },
  });
};