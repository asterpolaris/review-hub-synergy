
import { Reply, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Review } from "@/types/review";
import { ReviewReplyForm } from "./ReviewReplyForm";
import { useState } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ReviewReplySectionProps {
  review: Review;
  isEditing: boolean;
  isGenerating: boolean;
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
  onEdit,
  onCancelEdit,
  onDelete,
  onSubmitReply,
  onGenerateReply,
}: ReviewReplySectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  if (review.reply && !isEditing) {
    return (
      <>
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
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
          <p className="text-sm">{review.reply.comment}</p>
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
      </>
    );
  }

  return (
    <Collapsible open={isOpen || isEditing} onOpenChange={setIsOpen}>
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
      <CollapsibleContent className="mt-4">
        <ReviewReplyForm
          onSubmit={onSubmitReply}
          onCancel={onCancelEdit}
          onGenerateReply={onGenerateReply}
          isGenerating={isGenerating}
          initialValue={isEditing ? review.reply?.comment : ""}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};
