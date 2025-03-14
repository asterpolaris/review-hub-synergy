
import { AppLayout } from "@/components/layout/AppLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "@/hooks/useReviews";
import { useState } from "react";
import { ReviewFilters } from "@/components/reviews/ReviewFilters";
import { ReviewList } from "@/components/reviews/ReviewList";
import { convertGoogleRating } from "@/utils/reviewUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { syncBusinessReviews } from "@/utils/reviewProcessing";
import { useToast } from "@/hooks/use-toast";

const Reviews = () => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined } | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useReviews();
  const { googleAuthToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    setDateRange(range);
  };

  const handleSyncReviews = async () => {
    if (!data?.pages[0]?.businesses || data.pages[0].businesses.length === 0) {
      toast({
        title: "No businesses found",
        description: "There are no businesses to sync reviews for.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    
    try {
      const businesses = data.pages[0].businesses;
      let successCount = 0;
      let errorCount = 0;
      
      for (const business of businesses) {
        const result = await syncBusinessReviews(business.id);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast({
          title: "Sync completed",
          description: `Successfully synced reviews for ${successCount} business${successCount === 1 ? '' : 'es'}${errorCount > 0 ? `. Failed for ${errorCount} business${errorCount === 1 ? '' : 'es'}.` : '.'}`,
        });
        
        // Force refetch with the forceSync parameter
        await refetch();
      } else {
        toast({
          title: "Sync failed",
          description: `Could not sync reviews for any businesses.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync error",
        description: `An error occurred while syncing reviews: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
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

  // Combine all reviews from all pages
  const allReviews = data?.pages.flatMap(page => page.reviews) || [];
  // Get businesses from the first page
  const businesses = data?.pages[0]?.businesses || [];

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

    // Improved date filtering with proper start and end of day boundaries
    let dateMatch = true;
    if (dateRange?.from && dateRange?.to) {
      const reviewDate = parseISO(review.createTime);
      const fromDate = startOfDay(dateRange.from);
      const toDate = endOfDay(dateRange.to);
      
      dateMatch = reviewDate >= fromDate && reviewDate <= toDate;
    }
    
    return locationMatch && ratingMatch && replyStatusMatch && dateMatch;
  }).sort((a, b) => {
    const dateA = new Date(a.createTime).getTime();
    const dateB = new Date(b.createTime).getTime();
    return selectedSort === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
          <Button
            variant="outline"
            onClick={handleSyncReviews}
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Reviews
              </>
            )}
          </Button>
        </div>

        <ReviewFilters
          businesses={businesses}
          selectedLocations={selectedLocations}
          selectedRatings={selectedRatings}
          selectedReplyStatus={selectedReplyStatus}
          selectedSort={selectedSort}
          dateRange={dateRange}
          onLocationChange={handleLocationChange}
          onRatingChange={handleRatingChange}
          onReplyStatusChange={handleReplyStatusChange}
          onSortChange={handleSortChange}
          onDateRangeChange={handleDateRangeChange}
          visibleReviews={filteredReviews}
        />

        <ReviewList 
          reviews={filteredReviews}
          hasNextPage={hasNextPage}
          isLoading={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </AppLayout>
  );
};

export default Reviews;
