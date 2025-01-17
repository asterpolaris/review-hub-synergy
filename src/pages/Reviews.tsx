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

const fetchReviews = async (): Promise<Review[]> => {
  try {
    console.log("Fetching reviews...");
    
    // First get the access token and businesses from our database function
    const { data: functionData, error: functionError } = await supabase
      .rpc('reviews') as { data: ReviewsFunctionResponse | null, error: Error | null };

    if (functionError) {
      console.error("Database function error:", functionError);
      throw new Error(functionError.message);
    }

    if (!functionData || !functionData.access_token) {
      throw new Error("No Google access token found");
    }

    console.log("Got function data:", functionData);

    const allReviews: Review[] = [];
    
    // Fetch reviews for each business
    for (const business of functionData.businesses || []) {
      try {
        const response = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${business.google_place_id}/reviews`,
          {
            headers: {
              Authorization: `Bearer ${functionData.access_token}`,
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch reviews for ${business.name}:`, await response.text());
          continue;
        }

        const data = await response.json();
        const reviews = data.reviews || [];
        allReviews.push(
          ...reviews.map((review: any) => ({
            ...review,
            venueName: business.name,
            placeId: business.google_place_id,
          }))
        );
      } catch (error) {
        console.error(`Error fetching reviews for ${business.name}:`, error);
      }
    }

    // Sort by date and limit to 100
    return allReviews
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      .slice(0, 100);
  } catch (error) {
    console.error("Error in fetchReviews:", error);
    throw error;
  }
};

const Reviews = () => {
  const { toast } = useToast();
  const [selectedVenue, setSelectedVenue] = useState<string>("all");

  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ["reviews"],
    queryFn: fetchReviews,
    meta: {
      onError: (error: Error) => {
        console.error("Query error:", error);
        toast({
          title: "Error fetching reviews",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      },
    },
  });

  const filteredReviews = reviews?.filter(review => 
    selectedVenue === "all" || review.venueName === selectedVenue
  ).slice(0, 100);

  const venues = reviews 
    ? ["all", ...new Set(reviews.map(review => review.venueName))]
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
      </div>
    </AppLayout>
  );
};

export default Reviews;