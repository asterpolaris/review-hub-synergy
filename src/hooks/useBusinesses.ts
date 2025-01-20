import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoBusinesses } from "@/utils/demoData";

export const useBusinesses = () => {
  const { isDemo } = useDemo();

  return useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      if (isDemo) {
        return { data: demoBusinesses };
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*");

      if (error) throw error;
      return { data };
    },
  });
};