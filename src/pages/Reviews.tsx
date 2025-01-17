import { useState } from "react";
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
import { useReviews } from "@/hooks/useReviews";

const Reviews = () => {
  const [selectedVenue, setSelectedVenue] = useState<string>("all");
  const { data, isLoading, error } = useReviews();

  const filteredReviews = data?.reviews?.filter(review => 
    selectedVenue === "all" || review.venueName === selectedVenue
  );

  const venues = data?.businesses 
    ? ["all", ...data.businesses.map(b => b.name)]
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
                Error details: {error instanceof Error ? error.message : 'Unknown error'}
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

        {(!filteredReviews || filteredReviews.length === 0) && (
          <div className="text-center text-muted-foreground py-8">
            No reviews found for the selected business.
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reviews;