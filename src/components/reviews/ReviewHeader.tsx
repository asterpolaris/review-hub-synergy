import { MapPin } from "lucide-react";
import { Review } from "@/types/review";

interface ReviewHeaderProps {
  review: Review;
  rating: number;
  ratingColor: string;
}

export const ReviewHeader = ({ review, rating, ratingColor }: ReviewHeaderProps) => {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold">{review.authorName}</h3>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin size={16} />
          <span>{review.venueName}</span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <span className={`text-sm font-medium ${ratingColor}`}>
            {rating}/5
          </span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground">
        {new Date(review.createTime).toLocaleDateString()}
      </span>
    </div>
  );
};