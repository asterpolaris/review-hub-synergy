import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";

// Define the response type for the reviews RPC call
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
      
      // First get the business data and access token
      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews');
      
      if (reviewsError) {
        console.error("Error fetching reviews data:", reviewsError);
        throw reviewsError;
      }

      if (!reviewsData) {
        throw new Error("No data returned from reviews function");
      }

      console.log("Business data received:", reviewsData);

      // Fetch reviews for all businesses
      const allReviews: Review[] = [];
      const errors: string[] = [];

      for (const business of (reviewsData as ReviewsRPCResponse).businesses) {
        try {
          console.log(`Fetching reviews for ${business.name}`);
          const { data, error } = await supabase.functions.invoke('fetch-reviews', {
            body: {
              placeId: business.google_place_id,
              accessToken: (reviewsData as ReviewsRPCResponse).access_token
            }
          });

          if (error) {
            console.error(`Error fetching reviews for ${business.name}:`, error);
            errors.push(`${business.name}: ${error.message}`);
            continue;
          }

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

      // Show toast if there were any errors
      if (errors.length > 0) {
        toast({
          title: "Some reviews failed to load",
          description: errors.join('\n'),
          variant: "destructive",
        });
      }

      // Sort reviews by date
      return allReviews.sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
    },
  });
};