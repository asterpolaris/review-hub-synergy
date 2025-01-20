import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ReplyParams {
  reviewId: string;
  comment: string;
  placeId: string;
}

export const useReviewActions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session, googleAuthToken } = useAuth();

  const submitReply = useMutation({
    mutationFn: async ({ reviewId, comment, placeId }: ReplyParams) => {
      if (!googleAuthToken?.access_token) {
        throw new Error('No Google access token available');
      }

      if (!session) {
        throw new Error('No session available');
      }

      const response = await supabase.functions.invoke('reply-to-review', {
        body: { reviewId, comment, placeId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-google-token': googleAuthToken.access_token
        }
      });

      if (response.error) throw response.error;
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
      console.error('Error in useReviewActions:', error);
      toast({
        title: "Failed to post reply",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const deleteReply = useMutation({
    mutationFn: async ({ reviewId, placeId }: Omit<ReplyParams, "comment">) => {
      if (!googleAuthToken?.access_token) {
        throw new Error('No Google access token available');
      }

      if (!session) {
        throw new Error('No session available');
      }

      const response = await supabase.functions.invoke('reply-to-review', {
        body: { reviewId, placeId, delete: true },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-google-token': googleAuthToken.access_token
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Reply deleted successfully",
        description: "Your reply has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error) => {
      console.error('Error deleting reply:', error);
      toast({
        title: "Failed to delete reply",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  return {
    submitReply,
    deleteReply,
  };
};