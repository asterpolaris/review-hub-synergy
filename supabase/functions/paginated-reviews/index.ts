
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PaginationParams {
  page?: number;
  pageSize?: number;
  businessIds?: string[];
  ratings?: number[];
  replyStatus?: string[];
  startDate?: string;
  endDate?: string;
  sortBy?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Parse the request body
    const { 
      page = 1, 
      pageSize = 10, 
      businessIds, 
      ratings, 
      replyStatus,
      startDate,
      endDate,
      sortBy = 'newest'
    }: PaginationParams = await req.json()

    console.log('Fetching paginated reviews with params:', {
      page, pageSize, businessIds, ratings, replyStatus, startDate, endDate, sortBy
    })

    // Get user businesses first
    let businessQuery = supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)

    // Handle business filtering by Google Place IDs
    if (businessIds && businessIds.length > 0 && !businessIds.includes('all_businesses')) {
      // Fetch businesses that match the given Google Place IDs
      const { data: matchingBusinesses, error: matchingError } = await supabase
        .from('businesses')
        .select('id')
        .in('google_place_id', businessIds)
        .eq('user_id', user.id)
        
      if (matchingError) {
        throw matchingError
      }
      
      if (matchingBusinesses && matchingBusinesses.length > 0) {
        const matchingIds = matchingBusinesses.map(b => b.id)
        businessQuery = businessQuery.in('id', matchingIds)
      } else {
        // No matching businesses found, return empty result
        return new Response(
          JSON.stringify({ 
            reviews: [], 
            businessDetails: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const { data: userBusinesses, error: businessError } = await businessQuery
    
    if (businessError) {
      throw businessError
    }

    if (!userBusinesses || userBusinesses.length === 0) {
      return new Response(
        JSON.stringify({ 
          reviews: [], 
          businessDetails: [],
          totalCount: 0,
          currentPage: page,
          totalPages: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userBusinessIds = userBusinesses.map(b => b.id)
    
    // Build base query for reviews
    let reviewQuery = supabase
      .from('reviews')
      .select('*, businesses!inner(id, name, google_place_id)', { count: 'exact' })
      .in('business_id', userBusinessIds)
    
    // Apply filters
    if (ratings && ratings.length > 0) {
      reviewQuery = reviewQuery.in('rating', ratings)
    }
    
    if (replyStatus && replyStatus.length > 0) {
      if (replyStatus.includes('replied')) {
        reviewQuery = reviewQuery.not('reply', 'is', null)
      } else if (replyStatus.includes('waiting')) {
        reviewQuery = reviewQuery.is('reply', null)
      }
    }
    
    // Apply date range filter - ensure proper handling of ISO date strings
    if (startDate && endDate) {
      console.log('Filtering by date range:', { startDate, endDate })
      reviewQuery = reviewQuery.gte('create_time', startDate).lte('create_time', endDate)
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      reviewQuery = reviewQuery.order('create_time', { ascending: false })
    } else if (sortBy === 'oldest') {
      reviewQuery = reviewQuery.order('create_time', { ascending: true })
    } else if (sortBy === 'highest') {
      reviewQuery = reviewQuery.order('rating', { ascending: false })
    } else if (sortBy === 'lowest') {
      reviewQuery = reviewQuery.order('rating', { ascending: true })
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    reviewQuery = reviewQuery.range(from, to)
    
    const { data: reviews, error: reviewsError, count } = await reviewQuery
    
    if (reviewsError) {
      throw reviewsError
    }

    // Get business details for UI display
    const { data: businessDetails, error: detailsError } = await supabase
      .from('businesses')
      .select('id, name, google_place_id')
      .in('id', userBusinessIds)
    
    if (detailsError) {
      throw detailsError
    }

    // Transform reviews to match the expected format
    const transformedReviews = reviews.map(review => ({
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
      venueName: review.businesses.name,
      placeId: review.businesses.google_place_id,
      syncStatus: review.sync_status
    }))

    const totalPages = Math.ceil((count || 0) / pageSize)

    return new Response(
      JSON.stringify({ 
        reviews: transformedReviews, 
        businessDetails,
        totalCount: count,
        currentPage: page,
        totalPages
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in paginated-reviews function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('token') ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
