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

    console.log(`Fetching reviews for location: ${placeId}`)

    const response = await fetch(
      `https://mybusinessreviews.googleapis.com/v1/${placeId}/reviews`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched reviews:', data)

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fetch-reviews function:', error)
    return new Response(
      JSON.stringify({ error: error.message, details: error.stack }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})