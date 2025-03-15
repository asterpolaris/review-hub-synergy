
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
        
        // Get the current date and calculate last month
        const currentDate = new Date();
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const monthString = format(lastMonth, 'yyyy-MM');
        
        console.log(`Looking for cached insights for business ${businessId} for month ${monthString}`);
        
        // Try to get cached insights first
        const { data: cachedInsights, error: cachedError } = await supabase
          .from('venue_monthly_insights')
          .select('*')
          .eq('business_id', businessId)
          .eq('month', monthString)
          .single();
          
        if (cachedInsights) {
          console.log('Found cached insights:', cachedInsights);
          
          return {
            businessName: '', // Will be populated from business details below
            reviewCount: cachedInsights.review_count,
            analysis: cachedInsights.analysis,
            averageRating: cachedInsights.average_rating,
            responseRate: cachedInsights.response_rate
          };
        }
        
        if (cachedError && cachedError.code !== 'PGRST116') { // Not found error
          console.warn('Error fetching cached insights:', cachedError);
        }
        
        // Get the business details
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();
          
        if (businessError) throw businessError;
        
        console.log('No cached insights found, triggering generation');
        
        // Trigger the generation of insights via the edge function
        const { data: generationResult, error: generationError } = await supabase.functions.invoke('analyze-reviews-by-venue', {
          body: { 
            businessId,
            year: lastMonth.getFullYear(),
            month: lastMonth.getMonth() + 1 // Edge function expects 1-based months
          }
        });
        
        if (generationError) throw generationError;
        
        console.log('Generation result:', generationResult);
        
        // After generation, fetch the updated insights
        const { data: freshInsights, error: freshError } = await supabase
          .from('venue_monthly_insights')
          .select('*')
          .eq('business_id', businessId)
          .eq('month', monthString)
          .single();
          
        if (freshError) {
          console.error('Error fetching fresh insights:', freshError);
          
          // If we still can't get insights, fall back to the old method
          // Get all reviews for this business from the last month
          const oneMonthAgo = subMonths(currentDate, 1);
          const startDate = format(oneMonthAgo, "yyyy-MM-dd'T'00:00:00'Z'");
          const endDate = format(currentDate, "yyyy-MM-dd'T'23:59:59'Z'");
          
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
              analysis: "No reviews found for the past month.",
              averageRating: 0,
              responseRate: 0
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
          
          // Call the analyze-reviews-by-venue function directly
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
        }
        
        // Return the updated insights
        return {
          businessName: business.name,
          reviewCount: freshInsights.review_count,
          analysis: freshInsights.analysis,
          averageRating: freshInsights.average_rating,
          responseRate: freshInsights.response_rate
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
