import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoReviews, demoBusinesses } from "@/utils/demoData";
import { Review } from "@/types/review";

interface ReviewsResponse {
  reviews: Review[];
  businesses: any[];
}

export const useReviews = () => {
  const { isDemo } = useDemo();

  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      if (isDemo) {
        return {
          reviews: demoReviews,
          businesses: demoBusinesses,
        } as ReviewsResponse;
      }

      const { data: reviewsData, error } = await supabase.rpc("reviews");
      if (error) throw error;

      return reviewsData as ReviewsResponse;
    },
  });
};