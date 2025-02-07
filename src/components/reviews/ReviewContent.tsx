
import { MapPin } from "lucide-react";
import { Review } from "@/types/review";
import { getRatingColor, convertRating } from "./ReviewUtils";

interface ReviewContentProps {
  review: Review;
}

export const ReviewContent = ({ review }: ReviewContentProps) => {
  const rating = convertRating(review.rating);

  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{review.authorName}</h3>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin size={16} />
            <span>{review.venueName}</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-sm font-medium ${getRatingColor(rating)}`}>
              {rating}/5
            </span>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          {new Date(review.createTime).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm mt-4">{review.comment}</p>
      
      {review.photoUrls && review.photoUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
          {review.photoUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Review photo ${index + 1}`}
              className="h-24 w-24 object-cover rounded-md"
            />
          ))}
        </div>
      )}
    </div>
  );
};
