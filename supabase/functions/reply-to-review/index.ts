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

    // Clean up the placeId by removing the "locations/" prefix if present
    const locationId = placeId.replace('locations/', '')

    // First, get the account ID using the location
    const accountResponse = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!accountResponse.ok) {
      console.error('Error fetching account:', {
        status: accountResponse.status,
        statusText: accountResponse.statusText,
        body: await accountResponse.text()
      })
      throw new Error(`Failed to fetch account: ${accountResponse.status}`)
    }

    const accountData = await accountResponse.json()
    const accountName = accountData.name.split('/')[1]
    console.log('Retrieved account name:', accountName)

    // Now construct the review URL with the account ID
    const replyUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountName}/locations/${locationId}/reviews/${reviewId}/reply`
    console.log('Making request to:', replyUrl)

    const response = await fetch(replyUrl, {
      method: isDelete ? 'DELETE' : 'POST',
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
      console.error('Error response from reply endpoint:', {
        status: response.status,
        statusText: response.statusText,
        body: await response.text()
      })
      throw new Error(`Failed to ${isDelete ? 'delete' : 'post'} reply: ${response.status} ${await response.text()}`)
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