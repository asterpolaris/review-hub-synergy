import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatePeriod, ReviewMetrics } from "@/types/metrics";
import { useDemo } from "@/contexts/DemoContext";
import { demoMetrics } from "@/utils/demoData";

export const useReviewMetrics = (period: DatePeriod) => {
  const { isDemo } = useDemo();

  return useQuery({
    queryKey: ["metrics", period],
    queryFn: async () => {
      if (isDemo) {
        return demoMetrics;
      }

      const { data, error } = await supabase
        .from("cached_metrics")
        .select("metrics")
        .eq("period", period)
        .maybeSingle();

      if (error) throw error;

      // If no metrics found, return default metrics structure
      if (!data) {
        return {
          totalReviews: 0,
          averageRating: 0,
          responseRate: 0,
          badReviewResponseRate: 0,
          monthOverMonth: {
            totalReviews: 0,
            averageRating: 0,
            responseRate: 0,
            badReviewResponseRate: 0
          },
          previousPeriodMetrics: {
            totalReviews: 0,
            averageRating: 0,
            responseRate: 0,
            badReviewResponseRate: 0
          },
          venueMetrics: []
        } as ReviewMetrics;
      }

      return data.metrics as unknown as ReviewMetrics;
    },
  });
};