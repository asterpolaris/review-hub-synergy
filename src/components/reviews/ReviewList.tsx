
import { Review } from "@/types/review";
import { ReviewCard } from "./ReviewCard";
import { Loader2 } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
}

export const ReviewList = ({ 
  reviews, 
  isLoading
}: ReviewListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-lg py-12">
        No reviews found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};
