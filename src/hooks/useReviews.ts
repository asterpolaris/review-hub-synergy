import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

      for (const business of reviewsData.businesses) {
        try {
          console.log(`Fetching reviews for ${business.name}`);
          
          const headers = {
            'Authorization': `Bearer ${reviewsData.access_token}`,
            'Content-Type': 'application/json',
          };

          // First get the account ID
          console.log("Fetching Google accounts...");
          const accountsResponse = await fetch(
            "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
            { headers }
          );

          if (!accountsResponse.ok) {
            throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText}`);
          }

          const accountsData = await accountsResponse.json();
          console.log("Google accounts response:", accountsData);

          if (!accountsData.accounts || accountsData.accounts.length === 0) {
            throw new Error("No Google Business accounts found");
          }

          const accountId = accountsData.accounts[0].name.split('/')[1];
          const locationId = business.google_place_id.split('/').pop();

          // Fetch reviews using the account ID and location ID
          const reviewsUrl = `https://mybusinessreviews.googleapis.com/v1/accounts/${accountId}/locations/${locationId}/reviews`;
          console.log('Using reviews API URL:', reviewsUrl);

          const reviewsResponse = await fetch(reviewsUrl, { headers });

          if (!reviewsResponse.ok) {
            const errorText = await reviewsResponse.text();
            console.error(`Error response for ${business.name}:`, errorText);
            throw new Error(`API Error: ${errorText}`);
          }

          const data = await reviewsResponse.json();
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