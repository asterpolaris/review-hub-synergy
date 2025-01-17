import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Review } from "@/types/review";
import { supabase } from "@/integrations/supabase/client";

interface ReviewsFunctionResponse {
  access_token: string;
  businesses: Array<{
    name: string;
    google_place_id: string;
  }>;
}

const Reviews = () => {
  const { toast } = useToast();
  const [selectedVenue, setSelectedVenue] = useState<string>("all");

  // Fetch businesses and access token from the database function
  const { data: businessData, isLoading: isLoadingBusinesses, error: businessError } = useQuery({
    queryKey: ["business-data"],
    queryFn: async () => {
      console.log("Fetching business data...");
      const { data, error } = await supabase.rpc('reviews') as { 
        data: ReviewsFunctionResponse | null, 
        error: Error | null 
      };

      if (error) throw error;
      if (!data) throw new Error("No business data found");

      console.log("Business data received:", data);
      return data;
    },
  });

  // Fetch reviews for all businesses
  const { data: reviews, isLoading: isLoadingReviews, error: reviewsError } = useQuery({
    queryKey: ["reviews", businessData?.businesses],
    queryFn: async () => {
      if (!businessData?.access_token || !businessData?.businesses) {
        throw new Error("Missing required business data");
      }

      console.log("Fetching reviews for businesses...");
      const allReviews: Review[] = [];

      for (const business of businessData.businesses) {
        try {
          console.log(`Fetching reviews for ${business.name}`);
          const { data, error } = await supabase.functions.invoke('fetch-reviews', {
            body: {
              placeId: business.google_place_id,
              accessToken: businessData.access_token
            }
          });

          if (error) {
            console.error(`Error fetching reviews for ${business.name}:`, error);
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
        }
      }

      // Sort reviews by date
      return allReviews.sort((a, b) => 
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      );
    },
    enabled: !!businessData?.access_token && !!businessData?.businesses,
  });

  const error = businessError || reviewsError;
  const isLoading = isLoadingBusinesses || isLoadingReviews;

  const filteredReviews = reviews?.filter(review => 
    selectedVenue === "all" || review.venueName === selectedVenue
  );

  const venues = businessData?.businesses 
    ? ["all", ...businessData.businesses.map(b => b.name)]
    : ["all"];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
            <Skeleton className="h-10 w-[200px]" />
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load reviews. Please try again later.
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-xs">
                Error details: {error.message}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
          <Select
            value={selectedVenue}
            onValueChange={setSelectedVenue}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by business" />
            </SelectTrigger>
            <SelectContent>
              {venues.map(venue => (
                <SelectItem key={venue} value={venue}>
                  {venue === "all" ? "All Businesses" : venue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6">
          {filteredReviews?.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {filteredReviews?.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No reviews found for the selected business.
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reviews;