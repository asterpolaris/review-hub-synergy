import { Review } from "@/types/review";
import { ReviewCard } from "./ReviewCard";

interface ReviewListProps {
  reviews: Review[];
}

export const ReviewList = ({ reviews }: ReviewListProps) => {
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
    </div>
  );
};