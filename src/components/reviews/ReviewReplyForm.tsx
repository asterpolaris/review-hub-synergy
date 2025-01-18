import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";

interface ReviewReplyFormProps {
  onSubmit: (data: { comment: string }) => void;
  onCancel: () => void;
  onGenerateReply: () => void;
  isGenerating: boolean;
  isPending: boolean;
}

export const ReviewReplyForm = ({
  onSubmit,
  onCancel,
  onGenerateReply,
  isGenerating,
  isPending,
}: ReviewReplyFormProps) => {
  const form = useForm<{ comment: string }>();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex justify-end mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateReply}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Sparkles size={16} />
            {isGenerating ? "Generating..." : "Generate AI Response"}
          </Button>
        </div>
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Write your reply..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending..." : "Send Reply"}
          </Button>
        </div>
      </form>
    </Form>
  );
};