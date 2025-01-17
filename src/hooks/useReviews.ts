import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";

interface ReviewsRPCResponse {
  access_token: string;
  businesses: Array<{
    name: string;
    google_place_id: string;
  }>;
}

export const useReviews = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      console.log("Fetching business data...");
      
      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews') as { 
        data: ReviewsRPCResponse | null;
        error: Error | null;
      };
      
      if (reviewsError) {
        console.error("Error fetching reviews data:", reviewsError);
        throw reviewsError;
      }

      if (!reviewsData) {
        throw new Error("No data returned from reviews function");
      }

      console.log("Business data received:", reviewsData);

      const allReviews: Review[] = [];
      const errors: string[] = [];

      for (const business of reviewsData.businesses) {
        try {
          console.log(`Fetching reviews for ${business.name}`);
          
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/fetch-reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${reviewsData.access_token}`,
            },
            body: JSON.stringify({
              placeId: business.google_place_id,
              accessToken: reviewsData.access_token
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error response for ${business.name}:`, errorText);
            throw new Error(`API Error: ${errorText}`);
          }

          const data = await response.json();
          console.log(`Reviews received for ${business.name}:`, data);

          if (data?.reviews) {
            allReviews.push(
              ...data.reviews.map((review: any) => ({
                ...review,
                venueName: business.name,
                placeId: business.google_place_id,
              }))
            );
          }
        } catch (error) {
          console.error(`Failed to fetch reviews for ${business.name}:`, error);
          errors.push(`${business.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        toast({
          title: "Some reviews failed to load",
          description: errors.join('\n'),
          variant: "destructive",
        });
      }

      return allReviews.sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
    },
  });
};