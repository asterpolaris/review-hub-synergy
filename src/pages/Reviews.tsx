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
import { useState, useEffect } from "react";

const Reviews = () => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<string[]>([]);
  const { data, isLoading, error, refetch } = useReviews();

  // Trigger refetch when filters change
  useEffect(() => {
    refetch();
  }, [selectedLocations, selectedRatings, selectedReplyStatus, refetch]);

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
    
    const ratingMatch = 
      selectedRatings.length === 0 || 
      selectedRatings.includes('all_ratings') ||
      selectedRatings.includes(review.rating.toString());
    
    const replyStatusMatch = 
      selectedReplyStatus.length === 0 || 
      selectedReplyStatus.includes('all_status') ||
      (selectedReplyStatus.includes('waiting') && !review.reply) ||
      (selectedReplyStatus.includes('replied') && review.reply);
    
    return locationMatch && ratingMatch && replyStatusMatch;
  });

  const uniqueLocations = [...new Set(data?.reviews?.map(review => review.placeId) || [])];
  const ratingOptions = ["1", "2", "3", "4", "5"];
  const replyStatusOptions = [
    { value: "all_status", label: "All" },
    { value: "waiting", label: "Waiting for Reply" },
    { value: "replied", label: "Replied" }
  ];

  const handleLocationChange = (value: string) => {
    setSelectedLocations(value ? value.split(",").filter(Boolean) : []);
  };

  const handleRatingChange = (value: string) => {
    setSelectedRatings(value ? value.split(",").filter(Boolean) : []);
  };

  const handleReplyStatusChange = (value: string) => {
    setSelectedReplyStatus(value ? value.split(",").filter(Boolean) : []);
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
              onValueChange={handleRatingChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_ratings">All Ratings</SelectItem>
                {ratingOptions.map((rating) => (
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
                {replyStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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