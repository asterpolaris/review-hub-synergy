import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";
import { processReviewData } from "@/utils/reviewProcessing";
import { useAuth } from "@/contexts/AuthContext";

interface Business {
  id: string;
  name: string;
  google_place_id: string;
  venue_name: string;
}

interface ReviewsData {
  access_token: string;
  businesses: Business[];
}

interface PageTokens {
  [key: string]: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  businesses: Business[];
  hasNextPage: boolean;
  nextPageTokens?: PageTokens;
}

export const useReviews = () => {
  const { toast } = useToast();
  const { session } = useAuth();

  return useInfiniteQuery<ReviewsResponse, Error>({
    queryKey: ["reviews"],
    queryFn: async ({ pageParam }) => {
      console.log("Fetching reviews data with pageParam:", pageParam);
      
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      // First get the user's Google token and businesses
      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews') as { 
        data: ReviewsData | null;
        error: Error | null;
      };
      
      if (reviewsError || !reviewsData) {
        console.error("Error fetching reviews data:", reviewsError);
        throw reviewsError || new Error('No reviews data available');
      }

      // Process and fetch reviews from Google
      const { reviews, errors, nextPageTokens } = await processReviewData(
        reviewsData,
        pageParam as PageTokens
      );

      if (errors.length > 0) {
        toast({
          title: "Some reviews failed to load",
          description: errors.join('\n'),
          variant: "destructive",
        });
      }

      // After getting Google reviews, store them in our cache
      if (reviews.length > 0) {
        const { error: cacheError } = await supabase
          .from('reviews')
          .upsert(
            reviews.map(review => ({
              google_review_id: review.googleReviewId,
              business_id: reviewsData.businesses.find(b => b.google_place_id === review.placeId)?.id,
              author_name: review.authorName,
              rating: review.rating,
              comment: review.comment,
              create_time: review.createTime,
              reply: review.reply?.comment,
              reply_time: review.reply?.createTime,
              photo_urls: review.photoUrls,
              status: review.status
            })),
            { onConflict: 'google_review_id' }
          );

        if (cacheError) {
          console.error("Error caching reviews:", cacheError);
        }
      }

      return {
        reviews,
        businesses: reviewsData.businesses,
        hasNextPage: !!nextPageTokens && Object.keys(nextPageTokens).length > 0,
        nextPageTokens
      };
    },
    initialPageParam: null as PageTokens | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNextPage) return undefined;
      return lastPage.nextPageTokens;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};