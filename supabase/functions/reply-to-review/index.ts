import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-google-token',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reviewId, comment, placeId, isDelete } = await req.json()
    
    // Validate required parameters
    if (!placeId || !reviewId) {
      throw new Error('Missing required parameters')
    }

    // Get the Google access token from headers
    const googleToken = req.headers.get('x-google-token')
    if (!googleToken) {
      throw new Error('No Google access token provided')
    }

    console.log('Received request with parameters:', {
      placeId,
      reviewId,
      isDelete,
      hasComment: !!comment,
      hasGoogleToken: !!googleToken
    })

    // Construct the review URL using the mybusinessreviews.googleapis.com domain
    const replyUrl = `https://mybusinessreviews.googleapis.com/v1/locations/${placeId}/reviews/${reviewId}/reply`
    
    console.log('Making request to:', replyUrl)

    const response = await fetch(replyUrl, {
      method: isDelete ? 'DELETE' : 'PUT',
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: isDelete ? undefined : JSON.stringify({
        comment: comment
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response from reply endpoint:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })

      // Handle rate limiting specifically
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please wait a moment before trying again.',
            details: 'The Google Business Profile API rate limit has been reached.'
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': response.headers.get('Retry-After') || '60'
            }
          }
        )
      }

      throw new Error(`Failed to ${isDelete ? 'delete' : 'update'} reply: ${response.status} ${errorText}`)
    }

    const data = isDelete ? { success: true } : await response.json()
    console.log(`Reply ${isDelete ? 'deleted' : 'posted'} successfully:`, data)

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in reply-to-review function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'An error occurred while processing your request.'
      }),
      {
        status: error.status || 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})