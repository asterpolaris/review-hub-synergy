import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface ReviewCardProps {
  review: {
    id: string;
    authorName: string;
    rating: number;
    comment: string;
    createTime: string;
    photoUrls?: string[];
    reply?: {
      comment: string;
      createTime: string;
    };
  };
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  const handleSubmitReply = async () => {
    try {
      // TODO: Implement actual Google API call
      console.log("Submitting reply:", replyText, "for review:", review.id);
      
      toast({
        title: "Reply submitted",
        description: "Your response has been saved successfully.",
      });
      
      setIsReplying(false);
      setReplyText("");
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Error",
        description: "Failed to submit reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{review.authorName}</h3>
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
            <p className="text-sm font-medium mb-1">Your response:</p>
            <p className="text-sm">{review.reply.comment}</p>
            <span className="text-xs text-muted-foreground">
              {new Date(review.reply.createTime).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {!review.reply && !isReplying && (
          <Button
            onClick={() => setIsReplying(true)}
            variant="outline"
            className="w-full"
          >
            Reply to Review
          </Button>
        )}

        {isReplying && (
          <div className="w-full space-y-2">
            <Textarea
              placeholder="Write your response..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReplying(false);
                  setReplyText("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitReply}>Submit Reply</Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};