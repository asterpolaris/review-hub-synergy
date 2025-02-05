
import { Review } from "@/types/review";
import { ReviewCard } from "./ReviewCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
}

export const ReviewList = ({ 
  reviews, 
  onLoadMore, 
  hasNextPage, 
  isLoadingMore 
}: ReviewListProps) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No reviews found.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      {hasNextPage && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="min-w-[200px]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Reviews'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
