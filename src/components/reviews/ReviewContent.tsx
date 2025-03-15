
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
          <h3 className="text-lg font-semibold">{review.authorName}</h3>
          <div className="flex items-center gap-2 text-muted-foreground text-base mt-1">
            <MapPin size={18} />
            <span>{review.venueName}</span>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <span className={`text-base font-medium ${getRatingColor(rating)}`}>
              {rating}/5
            </span>
          </div>
        </div>
        <span className="text-base text-muted-foreground">
          {new Date(review.createTime).toLocaleDateString()}
        </span>
      </div>
      <p className="text-base mt-5 leading-relaxed">{review.comment}</p>
      
      {review.photoUrls && review.photoUrls.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-3 mt-5">
          {review.photoUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Review photo ${index + 1}`}
              className="h-28 w-28 object-cover rounded-md"
            />
          ))}
        </div>
      )}
    </div>
  );
};
