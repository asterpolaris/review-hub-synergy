import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";

export const useReviews = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      console.log("Fetching business data...");
      
      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews') as { 
        data: { access_token: string; businesses: Array<{ name: string; google_place_id: string }> } | null;
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

      try {
        // Call our Edge Function instead of making direct API calls
        const response = await fetch('/api/reviews/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: reviewsData.access_token,
            businesses: reviewsData.businesses
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from Edge Function:", errorText);
          throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}\nResponse: ${errorText}`);
        }

        const data = await response.json();
        console.log("Reviews data received:", data);

        if (data.reviews) {
          data.reviews.forEach((review: any) => {
            const business = reviewsData.businesses.find(
              b => b.google_place_id === review.locationName
            );
            
            if (business) {
              allReviews.push({
                ...review,
                venueName: business.name,
                placeId: business.google_place_id,
              });
            }
          });
        }

      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        errors.push(`Reviews request: ${error instanceof Error ? error.message : 'Unknown error'}`);
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