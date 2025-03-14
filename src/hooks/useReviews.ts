
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
    queryFn: async ({ pageParam, meta }) => {
      console.log("Fetching reviews data with pageParam:", pageParam);
      const forceSync = meta?.forceSync === true;
      
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews') as { 
        data: ReviewsData | null;
        error: Error | null;
      };
      
      if (reviewsError) {
        console.error("Error fetching reviews data:", reviewsError);
        throw reviewsError;
      }

      if (!reviewsData?.businesses || reviewsData.businesses.length === 0) {
        console.log("No businesses found in reviews data");
        return { 
          reviews: [], 
          businesses: [],
          hasNextPage: false 
        };
      }

      console.log("Reviews data received:", reviewsData);

      const { reviews, errors, nextPageTokens } = await processReviewData(
        reviewsData,
        pageParam as PageTokens,
        forceSync
      );

      if (errors.length > 0) {
        toast({
          title: "Some reviews failed to load",
          description: errors.join('\n'),
          variant: "destructive",
        });
      }

      console.log("Final reviews count:", reviews.length);
      console.log("Next page tokens:", nextPageTokens);

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
