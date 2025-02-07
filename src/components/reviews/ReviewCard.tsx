
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Review } from "@/types/review";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useReviewActions } from "@/hooks/useReviewActions";
import { ReviewContent } from "./ReviewContent";
import { ReviewReplySection } from "./ReviewReplySection";

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { submitReply, deleteReply } = useReviewActions();
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

  const handleSubmit = (data: { comment: string }) => {
    if (!review.placeId) {
      toast({
        title: "Error",
        description: "Place ID is missing",
        variant: "destructive",
      });
      return;
    }
    
    submitReply.mutate({
      reviewId: review.id,
      comment: data.comment,
      placeId: review.placeId
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <ReviewContent review={review} />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ReviewReplySection
          review={review}
          isEditing={isEditing}
          isGenerating={isGenerating}
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
