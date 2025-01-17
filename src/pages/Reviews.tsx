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
  const response = await fetch("/api/reviews?limit=100");
  if (!response.ok) {
    throw new Error("Failed to fetch reviews");
  }
  return response.json();
};

const Reviews = () => {
  const { toast } = useToast();
  const [selectedVenue, setSelectedVenue] = useState<string>("all");
  
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ["reviews"],
    queryFn: fetchReviews,
    meta: {
      onError: (error: Error) => {
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