import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoReviews } from "@/utils/demoData";

export const useReviews = () => {
  const { isDemo } = useDemo();

  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      if (isDemo) {
        return {
          reviews: demoReviews,
          businesses: demoBusinesses,
        };
      }

      const { data: reviewsData, error } = await supabase.rpc("reviews");
      if (error) throw error;

      return reviewsData;
    },
  });
};