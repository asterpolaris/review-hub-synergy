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

    // Clean up the placeId to ensure correct format and construct the review URL
    const locationId = placeId.replace('locations/', '')
    const replyUrl = `https://mybusinessreviews.googleapis.com/v1/locations/${locationId}/reviews/${reviewId}/reply`
    
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
        body: errorText,
        url: replyUrl
      })
      throw new Error(`Failed to ${isDelete ? 'delete' : 'update'} reply: ${response.status} ${errorText}`)
    }

    // For PUT requests, get the response data which includes the timestamp
    let responseData = null
    if (!isDelete) {
      responseData = await response.json()
      console.log('Reply posted successfully:', responseData)
    } else {
      console.log('Reply deleted successfully')
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in reply-to-review function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})