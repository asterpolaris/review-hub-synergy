
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review, ReviewsResponse } from "@/types/review";
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

export const useReviews = () => {
  const { toast } = useToast();
  const { session } = useAuth();

  return useInfiniteQuery({
    queryKey: ["reviews"],
    queryFn: async ({ pageParam }) => {
      console.log("Fetching reviews data with pageToken:", pageParam);
      
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
          nextPageToken: undefined 
        };
      }

      console.log("Reviews data received:", reviewsData);

      const { reviews, nextPageToken, errors } = await processReviewData(reviewsData, pageParam);

      if (errors.length > 0) {
        toast({
          title: "Some reviews failed to load",
          description: errors.join('\n'),
          variant: "destructive",
        });
      }

      console.log("Final reviews count:", reviews.length);
      return {
        reviews,
        businesses: reviewsData.businesses,
        nextPageToken
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
  });
};
