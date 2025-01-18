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
import { Button } from "@/components/ui/button";

const Reviews = () => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error, refetch } = useReviews({
    locationId: selectedLocations.includes('all_businesses') ? undefined : selectedLocations[0],
    rating: selectedRatings.includes('all_ratings') ? undefined : selectedRatings[0],
    replyStatus: selectedReplyStatus.includes('all_status') ? undefined : selectedReplyStatus[0],
    pageSize
  });

  const convertGoogleRating = (rating: string): string => {
    const ratingMap: { [key: string]: string } = {
      'ONE': '1',
      'TWO': '2',
      'THREE': '3',
      'FOUR': '4',
      'FIVE': '5'
    };
    return ratingMap[rating] || '0';
  };

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

  const handleLocationChange = (value: string) => {
    setSelectedLocations(value ? value.split(",").filter(Boolean) : []);
    setPageSize(10); // Reset page size when changing filters
  };

  const handleRatingChange = (value: string) => {
    setSelectedRatings(value ? value.split(",").filter(Boolean) : []);
    setPageSize(10); // Reset page size when changing filters
  };

  const handleReplyStatusChange = (value: string) => {
    setSelectedReplyStatus(value ? value.split(",").filter(Boolean) : []);
    setPageSize(10); // Reset page size when changing filters
  };

  const handleLoadMore = () => {
    setPageSize(prev => prev + 10);
  };

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
              onValueChange={handleLocationChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_businesses">All Businesses</SelectItem>
                {data?.businesses?.map((business) => (
                  <SelectItem key={business.google_place_id} value={business.google_place_id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-64">
            <Select
              value={selectedRatings.join(",")}
              onValueChange={handleRatingChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_ratings">All Ratings</SelectItem>
                {['1', '2', '3', '4', '5'].map((rating) => (
                  <SelectItem key={rating} value={rating}>
                    {rating} Stars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-64">
            <Select
              value={selectedReplyStatus.join(",")}
              onValueChange={handleReplyStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by reply status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_status">All</SelectItem>
                <SelectItem value="waiting">Waiting for Reply</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6">
          {data?.reviews?.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {data?.reviews && data.reviews.length > 0 && (
          <div className="flex justify-center mt-6">
            <Button onClick={handleLoadMore} variant="outline">
              Load More Reviews
            </Button>
          </div>
        )}

        {(!data?.reviews || data.reviews.length === 0) && (
          <div className="text-center text-muted-foreground py-8">
            No reviews found.
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reviews;