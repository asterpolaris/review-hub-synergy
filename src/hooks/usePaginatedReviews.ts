
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Business {
  id: string;
  name: string;
  google_place_id: string;
}

export interface PaginatedReviewsParams {
  page?: number;
  pageSize?: number;
  businessIds?: string[];
  ratings?: number[];
  replyStatus?: string[];
  startDate?: string;
  endDate?: string;
  sortBy?: string;
}

export interface PaginatedReviewsResponse {
  reviews: Review[];
  businessDetails: Business[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export const usePaginatedReviews = (params: PaginatedReviewsParams) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const { 
    page = 1, 
    pageSize = 10,
    businessIds,
    ratings,
    replyStatus,
    startDate,
    endDate,
    sortBy = 'newest'
  } = params;

  return useQuery<PaginatedReviewsResponse, Error>({
    queryKey: ["paginatedReviews", page, pageSize, businessIds, ratings, replyStatus, startDate, endDate, sortBy],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("No access token available");
      }

      // Log the request params for debugging
      console.log("Requesting paginated reviews with params:", { 
        page, pageSize, businessIds, ratings, replyStatus, startDate, endDate, sortBy 
      });

      try {
        const { data, error } = await supabase.functions.invoke('paginated-reviews', {
          body: { 
            page, 
            pageSize, 
            businessIds, 
            ratings, 
            replyStatus, 
            startDate, 
            endDate, 
            sortBy 
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) {
          console.error("Error fetching paginated reviews:", error);
          toast({
            title: "Failed to load reviews",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }

        console.log("Received paginated reviews:", data);
        return data as PaginatedReviewsResponse;
      } catch (error) {
        console.error("Error fetching paginated reviews:", error);
        toast({
          title: "Failed to load reviews",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
};
