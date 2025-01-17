import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { access_token, locationNames, accountId } = await req.json()

    if (!access_token || !locationNames || !accountId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching reviews for locations:', locationNames)

    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${accountId}/locations:batchGetReviews`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          locationNames,
          pageSize: 50,
          ignoreRatingOnlyReviews: false
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Error fetching reviews:', error)
      return new Response(
        JSON.stringify({ error: `Failed to fetch reviews: ${error}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    console.log('Reviews fetched successfully')

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in batch reviews function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})