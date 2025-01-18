import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Review } from "@/types/review";

interface ReplyParams {
  reviewId: string;
  comment: string;
  placeId: string;
}

export const useReviewReply = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, comment, placeId }: ReplyParams) => {
      const response = await supabase.functions.invoke('reply-to-review', {
        body: { reviewId, comment, placeId }
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Reply posted successfully",
        description: "Your reply has been posted.",
      });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to post reply",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
};