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
        .single();

      if (error) throw error;
      
      // Log the response to help with debugging
      console.log("Metrics data from backend:", data?.metrics);

      // Ensure we have valid metrics data
      if (!data?.metrics || typeof data.metrics !== 'object') {
        throw new Error('Invalid metrics data format');
      }

      // Return the properly structured metrics
      return {
        totalReviews: Number(data.metrics.totalReviews) || 0,
        averageRating: Number(data.metrics.averageRating) || 0,
        responseRate: Number(data.metrics.responseRate) || 0,
        badReviewResponseRate: Number(data.metrics.badReviewResponseRate) || 0,
        monthOverMonth: data.metrics.monthOverMonth || {
          totalReviews: 0,
          averageRating: 0,
          responseRate: 0,
          badReviewResponseRate: 0
        },
        previousPeriodMetrics: data.metrics.previousPeriodMetrics || {
          totalReviews: 0,
          averageRating: 0,
          responseRate: 0,
          badReviewResponseRate: 0
        },
        venueMetrics: Array.isArray(data.metrics.venueMetrics) ? data.metrics.venueMetrics : []
      } as ReviewMetrics;
    },
  });
};