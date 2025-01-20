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
      
      // First cast to unknown, then to ReviewMetrics to satisfy TypeScript
      return (data?.metrics as unknown) as ReviewMetrics;
    },
  });
};