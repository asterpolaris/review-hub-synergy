import { Button } from "@/components/ui/button";
import { Pencil, Reply, Trash2 } from "lucide-react";
import { Review } from "@/types/review";
import { ReviewReplyForm } from "./ReviewReplyForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ReviewReplySectionProps {
  review: Review;
  isOpen: boolean;
  isEditing: boolean;
  isGenerating: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSubmit: (data: { comment: string }) => void;
  onGenerateReply: (form: { setValue: (field: string, value: string) => void }) => void;
  isPending: boolean;
}

export const ReviewReplySection = ({
  review,
  isOpen,
  isEditing,
  isGenerating,
  onOpenChange,
  onEdit,
  onDelete,
  onCancel,
  onSubmit,
  onGenerateReply,
  isPending
}: ReviewReplySectionProps) => {
  if (review.reply && !isEditing) {
    return (
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
              onClick={onEdit}
              className="h-8 px-2"
            >
              <Pencil size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        <p className="text-sm">{review.reply.comment}</p>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen || isEditing} onOpenChange={onOpenChange}>
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
      </div>
      <CollapsibleContent className="mt-4">
        <ReviewReplyForm
          onSubmit={onSubmit}
          onCancel={onCancel}
          onGenerateReply={onGenerateReply}
          isGenerating={isGenerating}
          isPending={isPending}
          initialValue={isEditing ? review.reply?.comment : ""}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};