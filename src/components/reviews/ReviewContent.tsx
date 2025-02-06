import { Review } from "@/types/review";

interface ReviewContentProps {
  review: Review;
}

export const ReviewContent = ({ review }: ReviewContentProps) => {
  return (
    <div className="space-y-4">
      <p className="text-sm">{review.comment}</p>
      
      {review.photoUrls && review.photoUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
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