const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placeId, accessToken } = await req.json()

    if (!placeId || !accessToken) {
      throw new Error('Missing required parameters')
    }

    console.log(`Starting review fetch for place ID: ${placeId}`)

    // Format the location name correctly for the API
    const locationName = placeId.includes('locations/') ? placeId : `locations/${placeId}`
    console.log('Location name:', locationName)

    // Use the Business Profile API v4 endpoint
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${locationName}/reviews`
    console.log('Fetching reviews from URL:', reviewsUrl)

    const reviewsResponse = await fetch(reviewsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!reviewsResponse.ok) {
      const errorText = await reviewsResponse.text()
      console.error('Reviews API error response:', {
        status: reviewsResponse.status,
        statusText: reviewsResponse.statusText,
        url: reviewsUrl,
        body: errorText
      })
      throw new Error(`Failed to fetch reviews: ${reviewsResponse.status} ${reviewsResponse.statusText} - ${errorText}`)
    }

    const reviewsData = await reviewsResponse.json()
    console.log(`Successfully fetched reviews for location ${locationName}`)

    return new Response(
      JSON.stringify(reviewsData),
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