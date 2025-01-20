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
    const { reviewId, comment, placeId, delete: isDelete } = await req.json()
    
    if (!reviewId || !placeId) {
      throw new Error('Missing required parameters')
    }

    console.log('Processing review:', {
      reviewId,
      placeId,
      isDelete,
      commentPreview: comment ? comment.substring(0, 50) + '...' : undefined
    });

    // Get the Google access token from the custom header
    const googleToken = req.headers.get('x-google-token')
    if (!googleToken) {
      throw new Error('No Google token provided')
    }
    console.log('Using Google token:', googleToken.substring(0, 10) + '...')

    // First get the account ID
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.error('Error response from accounts endpoint:', {
        status: accountsResponse.status,
        statusText: accountsResponse.statusText,
        body: errorText
      })
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${errorText}`)
    }

    const accountsData = await accountsResponse.json()
    console.log("Google accounts response:", accountsData)

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      console.error('No Google Business accounts found')
      throw new Error('No Google Business accounts found')
    }

    const accountId = accountsData.accounts[0].name.split('/')[1]
    console.log('Using account ID:', accountId)

    // Clean up the placeId by removing the "locations/" prefix if present
    const locationId = placeId.replace('locations/', '')

    // Format the current time in RFC3339 format with UTC timezone
    const now = new Date()
    const utcTimestamp = now.toISOString()
    console.log('Using timestamp:', utcTimestamp)

    // Post the reply using the Google Business Profile API
    const replyUrl = `https://mybusiness.googleapis.com/v1/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`
    console.log('Making request to:', replyUrl)

    const response = await fetch(replyUrl, {
      method: isDelete ? 'DELETE' : 'PUT',
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: isDelete ? undefined : JSON.stringify({
        comment: comment,
        updateTime: utcTimestamp
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response from reply endpoint:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to ${isDelete ? 'delete' : 'post'} reply: ${response.status} ${errorText}`)
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
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})