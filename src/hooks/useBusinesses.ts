import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoBusinesses } from "@/utils/demoData";

interface Business {
  id: string;
  name: string;
  location: string;
  google_place_id: string;
  google_business_account_id: string;
  user_id: string;
}

export const useBusinesses = () => {
  const { isDemo } = useDemo();

  return useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      if (isDemo) {
        return demoBusinesses;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*");

      if (error) throw error;
      return data;
    },
  });
};