import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Reply } from "lucide-react";
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
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm font-medium text-yellow-500">
                {Number(review.rating).toFixed(1)}/5
              </span>
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
          <div className="bg-muted p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Reply size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Business Response</span>
              <span className="text-xs text-muted-foreground">
                {new Date(review.reply.createTime).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm">{review.reply.comment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};