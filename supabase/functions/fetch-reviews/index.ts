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

    // First get the account ID using the Business Profile API
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.error('Accounts API error response:', {
        status: accountsResponse.status,
        statusText: accountsResponse.statusText,
        body: errorText
      })
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText} - ${errorText}`)
    }

    const accountsData = await accountsResponse.json()
    console.log('Accounts data:', accountsData)

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No accounts found')
    }

    // Ensure we have the full location path
    const locationPath = placeId.startsWith('locations/') ? placeId : `locations/${placeId}`

    // Use the correct endpoint format for the Business Profile API
    const reviewsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationPath}/reviews`
    console.log('Fetching reviews from URL:', reviewsUrl)

    const reviewsResponse = await fetch(
      reviewsUrl,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!reviewsResponse.ok) {
      const errorText = await reviewsResponse.text()
      console.error('Reviews API error response:', {
        status: reviewsResponse.status,
        statusText: reviewsResponse.statusText,
        body: errorText,
        url: reviewsUrl
      })
      throw new Error(`Failed to fetch reviews: ${reviewsResponse.status} ${reviewsResponse.statusText} - ${errorText}`)
    }

    const reviewsData = await reviewsResponse.json()
    console.log(`Successfully fetched reviews for location ${locationPath}`)

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