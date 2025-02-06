import { Review } from "@/types/review";
import { VenueName } from "@/types/venue";

export const processReviewData = async (reviewsData: any, pageTokens?: any) => {
  const reviews: Review[] = [];
  const errors: string[] = [];
  const nextPageTokens: { [key: string]: string } = {};

  try {
    // Process each business's reviews
    for (const business of reviewsData.businesses) {
      // Ensure venue name is of type VenueName
      const venueName = (business.venue_name || 'Unknown Venue') as VenueName;

      try {
        // Fetch reviews for this business
        const response = await fetch(
          `/api/reviews-batch`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${reviewsData.access_token}`,
            },
            body: JSON.stringify({
              access_token: reviewsData.access_token,
              location_names: [business.google_place_id],
              page_tokens: pageTokens,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews for ${venueName}`);
        }

        const data = await response.json();
        
        // Process reviews for this location
        if (data.locationReviews && data.locationReviews.length > 0) {
          const locationReviews = data.locationReviews[0].reviews || [];
          
          // Transform each review into our Review type
          locationReviews.forEach((review: any) => {
            reviews.push({
              id: review.reviewId,
              googleReviewId: review.reviewId,
              authorName: review.reviewer.displayName,
              rating: review.starRating,
              comment: review.comment || '',
              createTime: review.createTime,
              photoUrls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || [],
              reply: review.reviewReply ? {
                comment: review.reviewReply.comment,
                createTime: review.reviewReply.updateTime
              } : undefined,
              venueName,
              placeId: business.google_place_id,
              status: review.reviewReply ? 'replied' : 'pending'
            });
          });

          // Store next page token if it exists
          if (data.nextPageTokens && data.nextPageTokens[business.google_place_id]) {
            nextPageTokens[business.google_place_id] = data.nextPageTokens[business.google_place_id];
          }
        }
      } catch (error) {
        console.error(`Error fetching reviews for ${venueName}:`, error);
        errors.push(`Failed to fetch reviews for ${venueName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('Error processing review data:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
  }

  return { reviews, errors, nextPageTokens };
};