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
        // First get the account ID
        console.log("Fetching Google accounts...");
        const accountsResponse = await fetch(
          "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
          { 
            headers: {
              'Authorization': `Bearer ${reviewsData.access_token}`,
              'Content-Type': 'application/json',
            }
          }
        );

        const accountsText = await accountsResponse.text();
        console.log("Google accounts raw response:", accountsText);

        if (!accountsResponse.ok) {
          console.error("Google accounts error response:", accountsText);
          throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText}`);
        }

        const accountsData = JSON.parse(accountsText);
        console.log("Google accounts parsed response:", accountsData);

        if (!accountsData.accounts || accountsData.accounts.length === 0) {
          throw new Error("No Google Business accounts found");
        }

        const accountId = accountsData.accounts[0].name.split('/')[1];
        
        // Prepare location names array for batch request
        const locationNames = reviewsData.businesses.map(business => business.google_place_id);

        // Make batch request for reviews
        const batchResponse = await fetch(
          `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations:batchGetReviews`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${reviewsData.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locationNames,
              pageSize: 50,
              ignoreRatingOnlyReviews: false
            })
          }
        );

        const batchText = await batchResponse.text();
        console.log("Batch reviews raw response:", batchText);

        if (!batchResponse.ok) {
          console.error("Batch reviews error response:", batchText);
          throw new Error(`Failed to fetch reviews batch: ${batchText}`);
        }

        const batchData = JSON.parse(batchText);
        console.log("Batch reviews parsed response:", batchData);

        // Process the batch response
        if (batchData.locationReviews) {
          batchData.locationReviews.forEach((locationReview: any) => {
            const business = reviewsData.businesses.find(
              b => b.google_place_id === locationReview.locationName
            );
            
            if (business && locationReview.reviews) {
              allReviews.push(
                ...locationReview.reviews.map((review: any) => ({
                  ...review,
                  venueName: business.name,
                  placeId: business.google_place_id,
                }))
              );
            }
          });
        }

      } catch (error) {
        console.error("Failed to fetch reviews batch:", error);
        errors.push(`Batch request: ${error instanceof Error ? error.message : 'Unknown error'}`);
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