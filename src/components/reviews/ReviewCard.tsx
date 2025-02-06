import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useReviewActions } from "@/hooks/useReviewActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReviewHeader } from "./ReviewHeader";
import { ReviewContent } from "./ReviewContent";
import { ReviewAnalysis } from "./ReviewAnalysis";
import { ReviewReplySection } from "./ReviewReplySection";

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
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [analysis, setAnalysis] = useState<{ sentiment: string; summary: string } | null>(null);
  const { submitReply, deleteReply } = useReviewActions();
  const { toast } = useToast();
  const rating = convertRating(review.rating);

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

  const analyzeReview = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-review', {
        body: { review }
      });

      if (error) throw error;
      
      setAnalysis(data);
      toast({
        title: "Review analyzed",
        description: "AI analysis has been completed.",
      });
    } catch (error) {
      toast({
        title: "Error analyzing review",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendAnalysisEmail = async () => {
    if (!analysis) return;
    
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-review-analysis', {
        body: { 
          venueName: review.venueName,
          analysis: `Sentiment: ${analysis.sentiment}\n\nSummary: ${analysis.summary}`
        }
      });

      if (error) throw error;

      toast({
        title: "Analysis sent",
        description: "The analysis has been sent to venue stakeholders.",
      });
    } catch (error) {
      toast({
        title: "Error sending analysis",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
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
        setIsOpen(false);
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
    setShowDeleteDialog(false);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <ReviewHeader 
          review={review}
          rating={rating}
          ratingColor={getRatingColor(rating)}
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ReviewContent review={review} />
        
        <ReviewAnalysis 
          analysis={analysis}
          onSendEmail={sendAnalysisEmail}
          isSendingEmail={isSendingEmail}
          venueName={review.venueName}
        />

        <ReviewReplySection
          review={review}
          isOpen={isOpen}
          isEditing={isEditing}
          isGenerating={isGenerating}
          onOpenChange={setIsOpen}
          onEdit={() => setIsEditing(true)}
          onDelete={() => setShowDeleteDialog(true)}
          onCancel={() => {
            setIsOpen(false);
            setIsEditing(false);
          }}
          onSubmit={handleSubmit}
          onGenerateReply={generateReply}
          isPending={submitReply.isPending}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeReview}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            <Search size={16} />
            {isAnalyzing ? "Analyzing..." : "Analyze Review"}
          </Button>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reply</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reply? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};