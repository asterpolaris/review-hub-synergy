import { AppLayout } from "@/components/layout/AppLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ReviewFilters } from "@/components/reviews/ReviewFilters";
import { ReviewList } from "@/components/reviews/ReviewList";
import { convertGoogleRating } from "@/utils/reviewUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, RefreshCw } from "lucide-react";
import { startOfDay, endOfDay, format, parseISO } from "date-fns";
import { syncBusinessReviews } from "@/utils/reviewProcessing";
import { useToast } from "@/hooks/use-toast";
import { usePaginatedReviews } from "@/hooks/usePaginatedReviews";
import { DateRange } from "react-day-picker";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 50;

const Reviews = () => {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const { googleAuthToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const businessIds = selectedLocations.length > 0 && !selectedLocations.includes('all_businesses') 
    ? selectedLocations 
    : undefined;
    
  const ratings = selectedRatings.length > 0 && !selectedRatings.includes('all_ratings')
    ? selectedRatings.map(r => parseInt(r))
    : undefined;
    
  const replyStatus = selectedReplyStatus.length > 0 && !selectedReplyStatus.includes('all_status')
    ? selectedReplyStatus
    : undefined;
    
  const startDateStr = dateRange?.from 
    ? format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss'Z'") 
    : undefined;
    
  const endDateStr = dateRange?.to 
    ? format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss'Z'") 
    : undefined;

  const { data, isLoading, error, refetch } = usePaginatedReviews({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    businessIds,
    ratings,
    replyStatus,
    startDate: startDateStr,
    endDate: endDateStr,
    sortBy: selectedSort
  });

  const handleLocationChange = (value: string) => {
    setSelectedLocations(value ? value.split(",").filter(Boolean) : []);
    setCurrentPage(1);
  };

  const handleRatingChange = (value: string) => {
    setSelectedRatings(value ? value.split(",").filter(Boolean) : []);
    setCurrentPage(1);
  };

  const handleReplyStatusChange = (value: string) => {
    setSelectedReplyStatus(value ? value.split(",").filter(Boolean) : []);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    console.log("Date range changed:", range);
    setDateRange(range);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSyncReviews = async () => {
    if (!data?.businessDetails || data.businessDetails.length === 0) {
      toast({
        title: "No businesses found",
        description: "There are no businesses to sync reviews for.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    
    try {
      const businesses = data.businessDetails;
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

  const reviews = data?.reviews || [];
  const businesses = data?.businessDetails || [];
  const totalPages = data?.totalPages || 1;

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
          visibleReviews={reviews}
        />

        <ReviewList 
          reviews={reviews}
          isLoading={isLoading}
        />

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }} 
                    />
                  </PaginationItem>
                )}
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageToShow: number | null = null;
                  
                  if (i === 0) {
                    pageToShow = 1;
                  } else if (i === 4) {
                    pageToShow = totalPages;
                  } else if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (currentPage <= 3) {
                    pageToShow = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i;
                  } else {
                    pageToShow = currentPage - 1 + i;
                  }
                  
                  if (i === 3 && totalPages > 5 && currentPage < totalPages - 2) {
                    return (
                      <PaginationItem key="ellipsis">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  if (i === 1 && totalPages > 5 && currentPage > 3) {
                    return (
                      <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  if (pageToShow !== null) {
                    return (
                      <PaginationItem key={pageToShow}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageToShow as number);
                          }}
                          isActive={currentPage === pageToShow}
                        >
                          {pageToShow}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }} 
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
        
        {data?.totalCount !== undefined && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {reviews.length} of {data.totalCount} reviews
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reviews;
