
import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export const useVenueInsights = (businessId?: string) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  return useQuery({
    queryKey: ["venue-insights", businessId],
    queryFn: async () => {
      if (!businessId || !session) return null;
      
      try {
        setLoading(true);
        
        // Get the current date and the date one month ago
        const currentDate = new Date();
        const oneMonthAgo = subMonths(currentDate, 1);
        
        // Format dates as ISO strings
        const startDate = format(oneMonthAgo, "yyyy-MM-dd'T'00:00:00'Z'");
        const endDate = format(currentDate, "yyyy-MM-dd'T'23:59:59'Z'");
        
        // Get the business details
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();
          
        if (businessError) throw businessError;
        
        // Get all reviews for this business from the last month
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            businesses:business_id (name)
          `)
          .eq('business_id', businessId)
          .gte('create_time', startDate)
          .lte('create_time', endDate);
          
        if (reviewsError) throw reviewsError;
        
        if (!reviews || reviews.length === 0) {
          return {
            businessName: business.name,
            reviewCount: 0,
            analysis: "No reviews found for the past month."
          };
        }
        
        // Transform the reviews into the format needed for analysis
        const formattedReviews = reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment || "",
          createTime: review.create_time,
          venueName: review.businesses?.name || business.name,
          authorName: review.author_name
        }));
        
        // Call the analyze-reviews-by-venue function
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-reviews-by-venue', {
          body: { reviews: formattedReviews }
        });
        
        if (analysisError) throw analysisError;
        
        return {
          businessName: business.name,
          reviewCount: reviews.length,
          analysis: analysisData.analysis,
          averageRating: reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length,
          responseRate: (reviews.filter(review => review.reply).length / reviews.length) * 100
        };
      } catch (error) {
        console.error("Error fetching venue insights:", error);
        toast({
          title: "Error",
          description: "Failed to load venue insights.",
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!businessId && !!session,
  });
};
