
import { AppLayout } from "@/components/layout/AppLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReviews } from "@/hooks/useReviews";
import { useState } from "react";
import { ReviewFilters } from "@/components/reviews/ReviewFilters";
import { ReviewList } from "@/components/reviews/ReviewList";
import { convertGoogleRating } from "@/utils/reviewUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Reviews = () => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const { 
    data, 
    isLoading, 
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useReviews();
  const { googleAuthToken } = useAuth();
  const navigate = useNavigate();

  const handleLocationChange = (value: string) => {
    setSelectedLocations(value ? value.split(",").filter(Boolean) : []);
  };

  const handleRatingChange = (value: string) => {
    setSelectedRatings(value ? value.split(",").filter(Boolean) : []);
  };

  const handleReplyStatusChange = (value: string) => {
    setSelectedReplyStatus(value ? value.split(",").filter(Boolean) : []);
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
  };

  if (!googleAuthToken) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h2 className="text-2xl font-semibold">Connect Google Business Profile</h2>
          <p className="text-muted-foreground text-center max-w-md">
            To view and manage your reviews, you need to connect your Google Business Profile account.
          </p>
          <Button onClick={() => navigate("/businesses")}>
            Connect Google Account
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
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

  const allReviews = data?.pages.flatMap(page => page.reviews) || [];
  
  const filteredReviews = allReviews.filter((review) => {
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
  }).sort((a, b) => {
    const dateA = new Date(a.createTime).getTime();
    const dateB = new Date(b.createTime).getTime();
    return selectedSort === "newest" ? dateB - dateA : dateA - dateB;
  });

  const businesses = data?.pages[0]?.businesses || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
        </div>

        <ReviewFilters
          businesses={businesses}
          selectedLocations={selectedLocations}
          selectedRatings={selectedRatings}
          selectedReplyStatus={selectedReplyStatus}
          selectedSort={selectedSort}
          onLocationChange={handleLocationChange}
          onRatingChange={handleRatingChange}
          onReplyStatusChange={handleReplyStatusChange}
          onSortChange={handleSortChange}
        />

        <ReviewList 
          reviews={filteredReviews} 
          onLoadMore={() => fetchNextPage()} 
          hasNextPage={hasNextPage}
          isLoadingMore={isFetchingNextPage}
        />
      </div>
    </AppLayout>
  );
};

export default Reviews;
