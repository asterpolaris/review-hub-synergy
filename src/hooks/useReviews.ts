import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import { processReviewData } from "@/utils/reviewProcessing";

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

      if (!reviewsData?.businesses || reviewsData.businesses.length === 0) {
        console.log("No businesses found in reviews data");
        return { reviews: [], businesses: [] };
      }

      console.log("Reviews data received:", reviewsData);

      const { reviews, errors } = await processReviewData(reviewsData);

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
        businesses: reviewsData.businesses
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};