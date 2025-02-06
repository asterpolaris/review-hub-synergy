import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Reply, Pencil, Trash2, Search, Mail } from "lucide-react";
import { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReviewReplyForm } from "./ReviewReplyForm";
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

        {analysis && (
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">AI Analysis</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={sendAnalysisEmail}
                disabled={isSendingEmail}
                className="flex items-center gap-2"
              >
                <Mail size={16} />
                {isSendingEmail ? "Sending..." : "Email Analysis"}
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-sm"><span className="font-medium">Sentiment:</span> {analysis.sentiment}</p>
              <p className="text-sm"><span className="font-medium">Summary:</span> {analysis.summary}</p>
            </div>
          </div>
        )}

        {review.reply && !isEditing && (
          <div className="bg-muted p-4 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Reply size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">Business Response</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.reply.createTime).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-2"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <p className="text-sm">{review.reply.comment}</p>
          </div>
        )}

        {(!review.reply || isEditing) && (
          <Collapsible open={isOpen || isEditing} onOpenChange={setIsOpen}>
            <div className="flex gap-2">
              <CollapsibleTrigger asChild>
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <Reply size={16} />
                    Reply to Review
                  </Button>
                )}
              </CollapsibleTrigger>
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
            <CollapsibleContent className="mt-4">
              <ReviewReplyForm
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsOpen(false);
                  setIsEditing(false);
                }}
                onGenerateReply={generateReply}
                isGenerating={isGenerating}
                isPending={submitReply.isPending}
                initialValue={isEditing ? review.reply?.comment : ""}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

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