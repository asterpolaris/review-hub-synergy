
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Review } from "@/types/review";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useReviewActions } from "@/hooks/useReviewActions";
import { ReviewContent } from "./ReviewContent";
import { ReviewReplySection } from "./ReviewReplySection";
import { submitReviewReply } from "@/utils/reviewProcessing";
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudOff } from "lucide-react";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { deleteReply } = useReviewActions();
  const { toast } = useToast();

  const generateReply = async (form: { setValue: (field: string, value: string) => void }) => {
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

  const handleSubmit = async (data: { comment: string }) => {
    if (!review.placeId) {
      toast({
        title: "Error",
        description: "Place ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      const result = await submitReviewReply(review.id, data.comment, review.placeId);
      
      if (result.success) {
        toast({
          title: "Reply submitted",
          description: "Your reply has been sent to Google and saved.",
        });
        setIsEditing(false);
      } else {
        toast({
          title: "Error submitting reply",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error submitting reply",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = () => {
    if (!review.placeId) {
      toast({
        title: "Error",
        description: "Place ID is missing",
        variant: "destructive",
      });
      return;
    }

    deleteReply.mutate({
      reviewId: review.id,
      placeId: review.placeId
    });
  };

  // Check if this review has a sync status from the database
  const getSyncStatus = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('sync_status')
      .eq('google_review_id', review.id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.sync_status;
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="relative">
        <div className="absolute top-2 right-2">
          {review.syncStatus === 'synced' ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Cloud className="h-3 w-3" />
              Synced
            </Badge>
          ) : review.syncStatus === 'pending_reply_sync' ? (
            <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing
            </Badge>
          ) : review.syncStatus === 'reply_sync_failed' ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <CloudOff className="h-3 w-3" />
              Sync Failed
            </Badge>
          ) : null}
        </div>
        <ReviewContent review={review} />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ReviewReplySection
          review={review}
          isEditing={isEditing}
          isGenerating={isGenerating}
          isSending={isSending}
          onEdit={() => setIsEditing(true)}
          onCancelEdit={() => setIsEditing(false)}
          onDelete={handleDelete}
          onSubmitReply={handleSubmit}
          onGenerateReply={generateReply}
        />
      </CardContent>
    </Card>
  );
};
