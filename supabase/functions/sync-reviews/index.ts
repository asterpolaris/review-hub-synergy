
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to convert Google's rating strings to numbers
function parseRating(rating: string | number): number {
  if (typeof rating === 'number') return rating;
  
  // Handle string number values
  if (!isNaN(Number(rating))) return Number(rating);
  
  // Handle text ratings
  const ratingMap: Record<string, number> = {
    'ONE': 1,
    'TWO': 2, 
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5
  };
  
  return ratingMap[rating] || 0;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    
    // Parse request body
    const { businessId } = await req.json()
    
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    console.log(`Starting sync process for business ID: ${businessId}`)
    
    // Get the business details and Google token
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, google_place_id, user_id')
      .eq('id', businessId)
      .single()
    
    if (businessError || !business) {
      throw new Error(`Business not found: ${businessError?.message}`)
    }
    
    // Get the Google auth token for the business owner
    const { data: googleToken, error: tokenError } = await supabase
      .from('google_auth_tokens')
      .select('access_token')
      .eq('user_id', business.user_id)
      .single()
    
    if (tokenError || !googleToken) {
      throw new Error(`Google token not found: ${tokenError?.message}`)
    }
    
    console.log(`Successfully found auth token for business: ${business.name}`)
    
    // Fetch reviews from Google API
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${googleToken.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )
    
    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${errorText}`)
    }
    
    const accountsData = await accountsResponse.json()
    
    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No Google Business accounts found')
    }
    
    const accountId = accountsData.accounts[0].name
    console.log(`Using account ID: ${accountId}`)
    
    // Clean up the location ID by removing any duplicate "locations/" prefix
    const locationId = business.google_place_id.replace(/^locations\//, '')
    
    // Construct the reviews URL
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/reviews`
    console.log(`Fetching reviews from: ${reviewsUrl}`)
    
    const reviewsResponse = await fetch(`${reviewsUrl}?pageSize=50`, {
      headers: {
        'Authorization': `Bearer ${googleToken.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    if (!reviewsResponse.ok) {
      const errorText = await reviewsResponse.text()
      throw new Error(`Failed to fetch reviews: ${reviewsResponse.status} ${errorText}`)
    }
    
    const reviewsData = await reviewsResponse.json()
    const reviews = reviewsData.reviews || []
    console.log(`Fetched ${reviews.length} reviews for business: ${business.name}`)
    
    // Process and store reviews in the database
    let processedCount = 0
    
    for (const review of reviews) {
      try {
        // Convert string ratings to numbers
        const numericRating = parseRating(review.starRating);
        console.log(`Processing review ${review.reviewId} with rating: ${review.starRating} (converted to ${numericRating})`);
        
        // Process the review
        const { data, error } = await supabase
          .from('reviews')
          .upsert({
            google_review_id: review.reviewId,
            business_id: business.id,
            author_name: review.reviewer.displayName,
            rating: numericRating,
            comment: review.comment || null,
            create_time: new Date(review.createTime).toISOString(),
            reply: review.reviewReply?.comment || null,
            reply_time: review.reviewReply?.createTime ? new Date(review.reviewReply.createTime).toISOString() : null,
            photo_urls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || null,
            sync_status: 'synced',
            google_sync_source: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'google_review_id',
            ignoreDuplicates: false
          });
        
        if (error) {
          console.error(`Error storing review ${review.reviewId}:`, error);
        } else {
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing review ${review.reviewId}:`, error);
      }
    }
    
    // Update the last_synced_at timestamp for the business
    await supabase
      .from('businesses')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', business.id)
    
    // Log the sync operation
    const duration = Date.now() - startTime
    await supabase
      .from('review_sync_logs')
      .insert({
        business_id: business.id,
        successful: true,
        reviews_fetched: reviews.length,
        reviews_processed: processedCount,
        duration_ms: duration
      })
    
    return new Response(
      JSON.stringify({
        message: 'Reviews synced successfully',
        business: business.name,
        fetched: reviews.length,
        processed: processedCount,
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in sync-reviews function:', error)
    
    // Log the sync error
    if (req.body) {
      try {
        const { businessId } = await req.json()
        if (businessId) {
          await supabase
            .from('review_sync_logs')
            .insert({
              business_id: businessId,
              successful: false,
              error_message: error.message,
              reviews_fetched: 0,
              reviews_processed: 0
            })
        }
      } catch (e) {
        console.error('Error logging sync failure:', e)
      }
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
