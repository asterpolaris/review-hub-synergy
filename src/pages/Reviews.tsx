import { AppLayout } from "@/components/layout/AppLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "@/hooks/useReviews";
import { useState } from "react";
import { ReviewFilters } from "@/components/reviews/ReviewFilters";
import { ReviewList } from "@/components/reviews/ReviewList";
import { convertGoogleRating } from "@/utils/reviewUtils";

const Reviews = () => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<string[]>([]);
  const { data, isLoading, error, refetch } = useReviews();

  const handleLocationChange = (value: string) => {
    setSelectedLocations(value ? value.split(",").filter(Boolean) : []);
  };

  const handleRatingChange = (value: string) => {
    setSelectedRatings(value ? value.split(",").filter(Boolean) : []);
  };

  const handleReplyStatusChange = (value: string) => {
    setSelectedReplyStatus(value ? value.split(",").filter(Boolean) : []);
  };

  const handleApplyFilters = () => {
    refetch();
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

  const filteredReviews = data?.reviews?.filter((review) => {
    const locationMatch = 
      selectedLocations.length === 0 || 
      selectedLocations.includes('all_businesses') ||
      selectedLocations.includes(review.placeId);
    
    const numericRating = convertGoogleRating(review.rating.toString());
    const ratingMatch = 
      selectedRatings.length === 0 || 
      selectedRatings.includes('all_ratings') ||
      selectedRatings.includes(numericRating.toString());
    
    const replyStatusMatch = 
      selectedReplyStatus.length === 0 || 
      selectedReplyStatus.includes('all_status') ||
      (selectedReplyStatus.includes('waiting') && !review.reply) ||
      (selectedReplyStatus.includes('replied') && review.reply);
    
    return locationMatch && ratingMatch && replyStatusMatch;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
        </div>

        <ReviewFilters
          businesses={data?.businesses || []}
          selectedLocations={selectedLocations}
          selectedRatings={selectedRatings}
          selectedReplyStatus={selectedReplyStatus}
          onLocationChange={handleLocationChange}
          onRatingChange={handleRatingChange}
          onReplyStatusChange={handleReplyStatusChange}
          onApplyFilters={handleApplyFilters}
        />

        <ReviewList reviews={filteredReviews || []} />
      </div>
    </AppLayout>
  );
};

export default Reviews;