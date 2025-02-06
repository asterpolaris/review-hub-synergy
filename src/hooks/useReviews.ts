import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";
import { processReviewData } from "@/utils/reviewProcessing";
import { useAuth } from "@/contexts/AuthContext";

interface Business {
  id: string;
  name: string;
  google_place_id: string;
  venue_name: string;
}

interface ReviewsData {
  access_token: string;
  businesses: Business[];
}

interface PageTokens {
  [key: string]: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  businesses: Business[];
  hasNextPage: boolean;
  nextPageTokens?: PageTokens;
}

export const useReviews = () => {
  const { toast } = useToast();
  const { session } = useAuth();

  return useInfiniteQuery<ReviewsResponse, Error>({
    queryKey: ["reviews"],
    queryFn: async ({ pageParam }) => {
      console.log("Fetching reviews data with pageParam:", pageParam);
      
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      // First try to get cached reviews
      const { data: cachedReviews, error: cacheError } = await supabase
        .from('reviews')
        .select(`
          id,
          google_review_id,
          author_name,
          rating,
          comment,
          create_time,
          reply,
          reply_time,
          photo_urls,
          status,
          businesses (
            id,
            name,
            google_place_id,
            venue_name
          )
        `)
        .order('create_time', { ascending: false });

      // If we have cached reviews and no pageParam, return them
      if (!pageParam && cachedReviews && !cacheError) {
        const businesses = cachedReviews
          .map(r => r.businesses)
          .filter((b, i, arr) => b && arr.findIndex(x => x?.id === b?.id) === i);

        const reviews = cachedReviews.map(r => ({
          id: r.id,
          googleReviewId: r.google_review_id,
          authorName: r.author_name,
          rating: r.rating,
          comment: r.comment,
          createTime: r.create_time,
          photoUrls: r.photo_urls,
          reply: r.reply ? {
            comment: r.reply,
            createTime: r.reply_time
          } : undefined,
          venueName: r.businesses?.venue_name || 'Unknown Venue',
          placeId: r.businesses?.google_place_id || '',
          status: r.status
        }));

        return {
          reviews,
          businesses,
          hasNextPage: false
        };
      }

      // If no cache or requesting next page, fetch from Google
      const { data: reviewsData, error: reviewsError } = await supabase.rpc('reviews') as { 
        data: ReviewsData | null;
        error: Error | null;
      };
      
      if (reviewsError || !reviewsData) {
        console.error("Error fetching reviews data:", reviewsError);
        throw reviewsError || new Error('No reviews data available');
      }

      const { reviews, errors, nextPageTokens } = await processReviewData(
        reviewsData,
        pageParam as PageTokens
      );

      if (errors.length > 0) {
        toast({
          title: "Some reviews failed to load",
          description: errors.join('\n'),
          variant: "destructive",
        });
      }

      return {
        reviews,
        businesses: reviewsData.businesses,
        hasNextPage: !!nextPageTokens && Object.keys(nextPageTokens).length > 0,
        nextPageTokens
      };
    },
    initialPageParam: null as PageTokens | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasNextPage) return undefined;
      return lastPage.nextPageTokens;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};