import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placeId, accessToken } = await req.json()

    if (!placeId || !accessToken) {
      throw new Error('Missing required parameters')
    }

    console.log(`Using location path: ${placeId}`)

    // Construct the full Google API URL with the correct endpoint structure
    const googleApiUrl = `https://mybusinessprofileservice.googleapis.com/v4/${placeId}/reviews`
    console.log(`Making request to: ${googleApiUrl}`)

    // Fetch reviews from Google API
    const response = await fetch(googleApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Google API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
        url: response.url
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
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})