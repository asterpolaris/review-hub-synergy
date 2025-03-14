
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { parseISO, isValid, subDays } from "date-fns";

interface ReviewsData {
  access_token: string;
  businesses: Array<{
    id: string;
    name: string;
    google_place_id: string;
  }>;
}

interface PageTokens {
  [key: string]: string;
}

export const processReviewData = async (
  reviewsData: ReviewsData, 
  pageTokens?: PageTokens
): Promise<{ 
  reviews: Review[], 
  errors: string[],
  nextPageTokens?: PageTokens 
}> => {
  const errors: string[] = [];
  const reviews: Review[] = [];

  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found');
    }

    console.log("Using cached reviews from database instead of direct API call");
    
    // Get user's business IDs
    const businessIds = reviewsData.businesses.map(b => b.id);
    
    // Fetch reviews from the database for these businesses
    let { data: cachedReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .in('business_id', businessIds)
      .order('create_time', { ascending: false });
    
    if (reviewsError) {
      console.error("Error fetching reviews from cache:", reviewsError);
      errors.push(`Failed to fetch reviews from cache: ${reviewsError.message}`);
      return { reviews, errors };
    }

    if (!cachedReviews || cachedReviews.length === 0) {
      // If no cached reviews, trigger a sync
      console.log("No cached reviews found, triggering sync");
      
      try {
        // Trigger sync for each business
        for (const business of reviewsData.businesses) {
          const { error: syncError } = await supabase.functions.invoke('manual-sync', {
            body: { businessId: business.id },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });
          
          if (syncError) {
            console.error(`Error triggering sync for business ${business.id}:`, syncError);
            errors.push(`Failed to sync business ${business.name}: ${syncError.message}`);
          }
        }
        
        // Fetch reviews again after sync
        const { data: freshReviews, error: freshError } = await supabase
          .from('reviews')
          .select('*')
          .in('business_id', businessIds)
          .order('create_time', { ascending: false });
        
        if (freshError) {
          throw freshError;
        }
        
        if (freshReviews && freshReviews.length > 0) {
          cachedReviews = freshReviews;
        } else {
          errors.push("No reviews found even after sync");
          return { reviews, errors };
        }
      } catch (syncError) {
        console.error("Error during sync process:", syncError);
        errors.push(`Sync process failed: ${syncError instanceof Error ? syncError.message : 'Unknown error'}`);
        return { reviews, errors };
      }
    }
    
    console.log("Found cached reviews:", cachedReviews.length);
    
    // Transform database reviews to the Review type
    cachedReviews.forEach(review => {
      const businessInfo = reviewsData.businesses.find(b => b.id === review.business_id);
      
      reviews.push({
        id: review.google_review_id,
        authorName: review.author_name,
        rating: review.rating,
        comment: review.comment || '',
        createTime: review.create_time,
        photoUrls: review.photo_urls || [],
        reply: review.reply ? {
          comment: review.reply,
          createTime: review.reply_time || new Date().toISOString()
        } : undefined,
        venueName: businessInfo?.name || 'Unknown Venue',
        placeId: businessInfo?.google_place_id || '',
        syncStatus: review.sync_status
      });
    });

    console.log("Transformed reviews count:", reviews.length);
    return { reviews, errors };

  } catch (error) {
    console.error("Error processing reviews:", error);
    errors.push(`Failed to process reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { reviews, errors };
  }
};

/**
 * Process a datetime string from the Google API
 * Handles potential relative dates (though Google actually sends ISO strings)
 * and ensures we always return a valid ISO date string
 */
function processDateTime(dateTimeString: string): string {
  // Log the original date string for debugging
  console.log("Processing date string:", dateTimeString);
  
  try {
    // Check if it's already a valid ISO string
    const parsedDate = parseISO(dateTimeString);
    if (isValid(parsedDate)) {
      return parsedDate.toISOString();
    }
    
    // Handle potential "X weeks ago" format (though Google API shouldn't send this)
    // This is just a fallback in case the format changes in the future
    if (dateTimeString.includes('weeks ago')) {
      const weeksMatch = dateTimeString.match(/(\d+)\s*weeks?\s*ago/i);
      if (weeksMatch && weeksMatch[1]) {
        const weeksAgo = parseInt(weeksMatch[1], 10);
        const date = subDays(new Date(), weeksAgo * 7);
        return date.toISOString();
      }
    }
    
    // Handle other relative date formats as needed
    if (dateTimeString.includes('days ago')) {
      const daysMatch = dateTimeString.match(/(\d+)\s*days?\s*ago/i);
      if (daysMatch && daysMatch[1]) {
        const daysAgo = parseInt(daysMatch[1], 10);
        const date = subDays(new Date(), daysAgo);
        return date.toISOString();
      }
    }
    
    // If we couldn't parse it, use current time as fallback
    console.warn("Unparseable date format, using current time:", dateTimeString);
    return new Date().toISOString();
  } catch (e) {
    console.error("Error processing date:", dateTimeString, e);
    // If any error occurs during parsing, use current time as fallback
    return new Date().toISOString();
  }
}

/**
 * Manually trigger a sync for a specific business
 */
export const syncBusinessReviews = async (businessId: string): Promise<{ success: boolean, message: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found');
    }

    const { error } = await supabase.functions.invoke('manual-sync', {
      body: { businessId },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error("Error syncing reviews:", error);
      return { 
        success: false, 
        message: `Failed to sync reviews: ${error.message}` 
      };
    }

    return { 
      success: true, 
      message: "Reviews synced successfully" 
    };
  } catch (error) {
    console.error("Error syncing reviews:", error);
    return { 
      success: false, 
      message: `Failed to sync reviews: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Submit a reply to a review
 * This will update the reply in the database and send it to Google
 */
export const submitReviewReply = async (
  reviewId: string,
  comment: string,
  placeId: string
): Promise<{ success: boolean, message: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found');
    }

    // First update the reply in the database
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        reply: comment,
        reply_time: new Date().toISOString(),
        sync_status: 'pending_reply_sync'
      })
      .eq('google_review_id', reviewId);

    if (updateError) {
      console.error("Error updating review reply in database:", updateError);
      return {
        success: false,
        message: `Failed to save reply: ${updateError.message}`
      };
    }

    // Call the reply-to-review edge function to send the reply to Google
    const { error: replyError } = await supabase.functions.invoke('reply-to-review', {
      body: {
        reviewId,
        comment,
        placeId
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (replyError) {
      console.error("Error sending reply to Google:", replyError);
      
      // Mark the reply as failed in the database
      await supabase
        .from('reviews')
        .update({
          sync_status: 'reply_sync_failed'
        })
        .eq('google_review_id', reviewId);
      
      return {
        success: false,
        message: `Failed to send reply to Google: ${replyError.message}`
      };
    }

    // Mark the reply as successfully synced
    await supabase
      .from('reviews')
      .update({
        sync_status: 'synced'
      })
      .eq('google_review_id', reviewId);

    return {
      success: true,
      message: "Reply submitted successfully"
    };
  } catch (error) {
    console.error("Error submitting review reply:", error);
    return {
      success: false,
      message: `Failed to submit reply: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
