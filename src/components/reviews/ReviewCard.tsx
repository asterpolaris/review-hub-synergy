import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Reply } from "lucide-react";
import { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useReviewReply } from "@/hooks/useReviewReply";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReviewReplyForm } from "./ReviewReplyForm";

interface ReviewCardProps {
  review: Review;
}

const convertRating = (rating: string | number): number => {
  const ratingMap: { [key: string]: number } = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5
  };
  
  if (typeof rating === 'string' && rating in ratingMap) {
    return ratingMap[rating];
  }
  return Number(rating);
};

const getRatingColor = (rating: number): string => {
  if (rating >= 4) return "text-green-500";
  if (rating === 3) return "text-yellow-500";
  return "text-red-500";
};

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { mutate: submitReply, isPending } = useReviewReply();
  const { toast } = useToast();
  const rating = convertRating(review.rating);

  const generateReply = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-review-reply', {
        body: { review }
      });

      if (error) throw error;
      
      form.setValue('comment', data.reply);
      toast({
        title: "Response generated",
        description: "AI-generated response has been added to the reply box.",
      });
    } catch (error) {
      toast({
        title: "Error generating response",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = (data: { comment: string }) => {
    if (!review.placeId) {
      toast({
        title: "Error",
        description: "Place ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    submitReply({
      reviewId: review.id,
      comment: data.comment,
      placeId: review.placeId
    }, {
      onSuccess: () => {
        setIsOpen(false);
      }
    });
  };
  
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
              <span className={`text-sm font-medium ${getRatingColor(rating)}`}>
                {rating}/5
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

        {!review.reply && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <Reply size={16} />
                Reply to Review
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <ReviewReplyForm
                onSubmit={onSubmit}
                onCancel={() => setIsOpen(false)}
                onGenerateReply={generateReply}
                isGenerating={isGenerating}
                isPending={isPending}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};