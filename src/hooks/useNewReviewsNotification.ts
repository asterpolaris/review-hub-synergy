
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useNewReviewsNotification = () => {
  const [newReviewsCount, setNewReviewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkForNewReviews = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        
        // First check if we have a last_login record for this user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('last_reviews_check')
          .eq('id', session.user.id)
          .single();
        
        const lastReviewsCheck = profileData?.last_reviews_check || new Date(0).toISOString();

        // Get reviews created after last check
        const { data: newReviews, error } = await supabase
          .from('reviews')
          .select('id, business_id')
          .gt('created_at', lastReviewsCheck)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setNewReviewsCount(newReviews?.length || 0);
        
        // Update the last_reviews_check time
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ last_reviews_check: new Date().toISOString() })
          .eq('id', session.user.id);
          
        if (updateError) {
          console.error("Error updating last_reviews_check:", updateError);
        }
      } catch (error) {
        console.error("Error checking for new reviews:", error);
        toast({
          variant: "destructive",
          title: "Notification Error",
          description: "Failed to check for new reviews",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      checkForNewReviews();
    }
  }, [session, toast]);

  const clearNotifications = async () => {
    if (!session?.user) return;
    
    try {
      // Update the last checked time to now
      await supabase
        .from('profiles')
        .update({ last_reviews_check: new Date().toISOString() })
        .eq('id', session.user.id);
        
      setNewReviewsCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return { newReviewsCount, loading, clearNotifications };
};
