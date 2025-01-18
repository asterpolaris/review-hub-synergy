import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, MapPin } from "lucide-react";
import { Review } from "@/types/review";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{review.authorName}</h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin size={16} />
              <span>{review.venueName}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} className="fill-current" size={16} />
              ))}
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {new Date(review.createTime).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
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

        {review.reply && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Previous response:</p>
            <p className="text-sm">{review.reply.comment}</p>
            <span className="text-xs text-muted-foreground">
              {new Date(review.reply.createTime).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};