import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { accountId, placeId, reviewId, comment, isDelete } = await req.json()
    
    // Validate required parameters
    if (!accountId || !placeId || !reviewId) {
      throw new Error('Missing required parameters')
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Extract the access token
    const accessToken = authHeader.replace('Bearer ', '')
    if (!accessToken) {
      throw new Error('No access token provided')
    }

    console.log('Received request with parameters:', {
      accountId,
      placeId,
      reviewId,
      isDelete,
      hasComment: !!comment
    })

    // Clean up the placeId by removing the "locations/" prefix if present
    const locationId = placeId.replace('locations/', '')

    const replyUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`
    console.log('Making request to:', replyUrl)

    const response = await fetch(replyUrl, {
      method: isDelete ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: isDelete ? undefined : JSON.stringify({
        comment: comment
      })
    })

    if (!response.ok) {
      console.error('Error response from reply endpoint:', {
        status: response.status,
        statusText: response.statusText,
        body: await response.text()
      })
      throw new Error(`Failed to post reply: ${response.status} ${await response.text()}`)
    }

    // For POST requests, get the response data which includes the timestamp
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
        data: responseData // This will include the createTime from Google's API
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