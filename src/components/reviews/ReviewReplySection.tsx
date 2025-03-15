
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Review } from "@/types/review";
import { ReviewReplyForm } from "./ReviewReplyForm";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ReviewReplySectionProps {
  review: Review;
  isEditing: boolean;
  isGenerating: boolean;
  isSending?: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSubmitReply: (data: { comment: string }) => void;
  onGenerateReply: (form: { setValue: (field: string, value: string) => void }) => void;
}

export const ReviewReplySection = ({
  review,
  isEditing,
  isGenerating,
  isSending = false,
  onEdit,
  onCancelEdit,
  onDelete,
  onSubmitReply,
  onGenerateReply
}: ReviewReplySectionProps) => {
  if (isEditing) {
    return (
      <Card className="border-dashed border-primary/50">
        <CardHeader>
          <CardTitle className="text-base">Your Reply</CardTitle>
          <CardDescription className="text-base">
            {review.reply 
              ? "Edit your response to this review" 
              : "Add a response to this review"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewReplyForm
            initialValue={review.reply?.comment}
            onSubmit={onSubmitReply}
            onCancel={onCancelEdit}
            onGenerateReply={onGenerateReply}
            isGenerating={isGenerating}
            isSending={isSending}
          />
        </CardContent>
      </Card>
    );
  }

  if (review.reply) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex justify-between">
            <CardTitle className="text-base">Your Reply</CardTitle>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-base"
                onClick={onEdit}
              >
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-base"
                onClick={onDelete}
              >
                Delete
              </Button>
            </div>
          </div>
          <CardDescription className="text-base">
            {review.reply.createTime && (
              <span>Replied on {format(new Date(review.reply.createTime), 'MMM d, yyyy')}</span>
            )}
            {review.syncStatus === 'pending_reply_sync' && (
              <span className="ml-2 text-yellow-600 inline-flex items-center">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Sending to Google...
              </span>
            )}
            {review.syncStatus === 'reply_sync_failed' && (
              <span className="ml-2 text-red-600">
                Failed to sync with Google
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed text-left">{review.reply.comment}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex justify-center py-2">
      <Button variant="outline" className="text-base py-6 px-8" onClick={onEdit}>
        {isSending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          "Reply to this review"
        )}
      </Button>
    </div>
  );
};
