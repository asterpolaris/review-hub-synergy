import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Review } from "@/types/review";
import { Json } from "@/integrations/supabase/types";

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

      // Update the cache with the new reply
      const { data: cachedReview } = await supabase
        .from('cached_reviews')
        .select('review_data, business_id')
        .eq('google_review_id', reviewId)
        .maybeSingle();

      if (cachedReview && cachedReview.review_data) {
        const reviewData = cachedReview.review_data as unknown as Review;
        const updatedReviewData: Review = {
          ...reviewData,
          reply: {
            comment,
            createTime: new Date().toISOString()
          }
        };

        await supabase
          .from('cached_reviews')
          .update({ 
            review_data: updatedReviewData as unknown as Json 
          })
          .eq('google_review_id', reviewId);
      }

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Reply posted successfully",
        description: "Your reply has been posted and the cache has been updated.",
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