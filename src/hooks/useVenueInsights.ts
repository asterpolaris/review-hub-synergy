
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export const useVenueInsights = (businessId?: string) => {
  const { toast } = useToast();
  const { session } = useAuth();

  return useQuery({
    queryKey: ["venue-insights", businessId],
    queryFn: async () => {
      if (!businessId || !session) return null;
      
      try {
        console.log(`Fetching venue insights for business ${businessId}`);
        
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
          
          // Get the business details
          const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('name')
            .eq('id', businessId)
            .single();
            
          return {
            businessName: business?.name || '',
            reviewCount: cachedInsights.review_count,
            analysis: cachedInsights.analysis,
            averageRating: cachedInsights.average_rating,
            responseRate: cachedInsights.response_rate
          };
        }
        
        if (cachedError && cachedError.code !== 'PGRST116') { // Not found error
          console.warn('Error fetching cached insights:', cachedError);
        }
        
        console.log('No cached insights found, getting business details');
        
        // Get the business details
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();
          
        if (businessError) {
          console.error('Error fetching business details:', businessError);
          throw businessError;
        }
        
        console.log('Triggering insights generation');
        
        // Trigger the generation of insights via the edge function
        const { data: generationResult, error: generationError } = await supabase.functions.invoke('analyze-reviews-by-venue', {
          body: { 
            businessId,
            year: lastMonth.getFullYear(),
            month: lastMonth.getMonth() + 1 // Edge function expects 1-based months
          }
        });
        
        if (generationError) {
          console.error('Error generating insights:', generationError);
          throw new Error(`Failed to generate insights: ${generationError.message || 'Unknown error'}`);
        }
        
        console.log('Generation result:', generationResult);
        
        // After generation, fetch the updated insights with retry logic
        let retries = 0;
        const maxRetries = 3;
        let freshInsights = null;
        let freshError = null;
        
        while (retries < maxRetries && !freshInsights) {
          if (retries > 0) {
            console.log(`Retry ${retries} to fetch fresh insights after generation`);
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const { data, error } = await supabase
            .from('venue_monthly_insights')
            .select('*')
            .eq('business_id', businessId)
            .eq('month', monthString)
            .single();
            
          if (data) {
            freshInsights = data;
            break;
          } else {
            freshError = error;
            retries++;
          }
        }
          
        if (freshInsights) {
          console.log('Successfully fetched fresh insights after generation:', freshInsights);
          
          return {
            businessName: business.name,
            reviewCount: freshInsights.review_count,
            analysis: freshInsights.analysis,
            averageRating: freshInsights.average_rating,
            responseRate: freshInsights.response_rate
          };
        }
        
        console.error('Error fetching fresh insights after retries:', freshError);
        
        // If we still can't get insights, fall back to the old method
        console.log('Falling back to direct review analysis');
        
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
          
        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
          throw reviewsError;
        }
        
        if (!reviews || reviews.length === 0) {
          console.log('No reviews found for direct analysis');
          return {
            businessName: business.name,
            reviewCount: 0,
            analysis: "No reviews found for the past month.",
            averageRating: 0,
            responseRate: 0
          };
        }
        
        console.log(`Found ${reviews.length} reviews for direct analysis`);
        
        // Transform the reviews into the format needed for analysis
        const formattedReviews = reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment || "",
          createTime: review.create_time,
          venueName: review.businesses?.name || business.name,
          authorName: review.author_name
        }));
        
        console.log('Sending reviews for direct analysis');
        
        // Call the analyze-reviews-by-venue function directly with reviews
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-reviews-by-venue', {
          body: { reviews: formattedReviews }
        });
        
        if (analysisError) {
          console.error('Error analyzing reviews directly:', analysisError);
          throw analysisError;
        }
        
        console.log('Analysis result:', analysisData);
        
        return {
          businessName: business.name,
          reviewCount: reviews.length,
          analysis: analysisData.analysis || "Unable to generate analysis.",
          averageRating: reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length,
          responseRate: (reviews.filter(review => review.reply).length / reviews.length) * 100
        };
        
      } catch (error) {
        console.error("Error fetching venue insights:", error);
        toast({
          title: "Error",
          description: "Failed to load venue insights. Please try again later.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!businessId && !!session,
    retry: 2,
    retryDelay: 1000,
  });
};
