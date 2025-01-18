import { AppLayout } from "@/components/layout/AppLayout";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "@/hooks/useReviews";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const Reviews = () => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const { data, isLoading, error } = useReviews();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
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

  const filteredReviews = data?.reviews?.filter((review) => {
    const locationMatch = selectedLocations.length === 0 || selectedLocations.includes(review.placeId);
    const ratingMatch = selectedRatings.length === 0 || selectedRatings.includes(review.rating.toString());
    return locationMatch && ratingMatch;
  });

  const uniqueLocations = [...new Set(data?.reviews?.map(review => review.placeId) || [])];
  const ratingOptions = ["1", "2", "3", "4", "5"];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="w-64">
            <Select
              value={selectedLocations.join(",")}
              onValueChange={(value) => setSelectedLocations(value ? value.split(",") : [])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                {uniqueLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {data?.businesses?.find(b => b.google_place_id === location)?.name || location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-64">
            <Select
              value={selectedRatings.join(",")}
              onValueChange={(value) => setSelectedRatings(value ? value.split(",") : [])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map((rating) => (
                  <SelectItem key={rating} value={rating}>
                    {rating} Stars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredReviews?.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {(!filteredReviews || filteredReviews.length === 0) && (
          <div className="text-center text-muted-foreground py-8">
            No reviews found.
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reviews;