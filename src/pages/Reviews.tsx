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

const fetchReviews = async (): Promise<Review[]> => {
  try {
    console.log("Fetching reviews...");
    const response = await fetch("/api/reviews?limit=100");
    console.log("Reviews response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error fetching reviews:", errorData);
      throw new Error(`Failed to fetch reviews: ${errorData}`);
    }

    const data = await response.json();
    console.log("Reviews data:", data);
    return data;
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