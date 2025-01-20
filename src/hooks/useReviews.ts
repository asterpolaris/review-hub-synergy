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

      // Log the response to help with debugging
      console.log("Reviews data from backend:", reviewsData);

      // Ensure we have the correct data structure
      if (!reviewsData || typeof reviewsData !== 'object') {
        throw new Error('Invalid response format from reviews function');
      }

      // Return the properly structured data
      return {
        reviews: Array.isArray(reviewsData.reviews) ? reviewsData.reviews : [],
        businesses: Array.isArray(reviewsData.businesses) ? reviewsData.businesses : []
      } as ReviewsResponse;
    },
  });
};