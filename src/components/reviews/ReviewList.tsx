
import { Review } from "@/types/review";
import { ReviewCard } from "./ReviewCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
  hasNextPage?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export const ReviewList = ({ 
  reviews, 
  hasNextPage, 
  isLoading,
  onLoadMore 
}: ReviewListProps) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No reviews found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more...
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
