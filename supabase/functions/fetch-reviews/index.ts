import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { placeId, accessToken } = await req.json()

    if (!placeId || !accessToken) {
      throw new Error('Missing required parameters')
    }

    console.log(`Fetching reviews for place: ${placeId}`)

    // Extract the location ID from the placeId (removing the "locations/" prefix)
    const locationId = placeId.replace('locations/', '')

    // Construct the full Google API URL - using the correct Business Profile API endpoint
    const googleApiUrl = `https://mybusiness.googleapis.com/v4/${placeId}/reviews`
    console.log(`Making request to: ${googleApiUrl}`)

    // Fetch reviews from Google API
    const response = await fetch(googleApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: googleApiUrl
      })
      throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched reviews for ${placeId}`)

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error in fetch-reviews function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})