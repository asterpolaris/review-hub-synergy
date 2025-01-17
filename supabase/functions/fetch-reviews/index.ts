import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placeId, accessToken } = await req.json()

    if (!placeId || !accessToken) {
      throw new Error('Missing required parameters')
    }

    console.log(`Starting review fetch for place ID: ${placeId}`)
    console.log('Access token length:', accessToken.length)

    // First get the account ID using the Business Profile API
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const errorText = await accountsResponse.text()
    console.log('Accounts API response:', {
      status: accountsResponse.status,
      statusText: accountsResponse.statusText,
      body: errorText
    })

    if (!accountsResponse.ok) {
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText} - ${errorText}`)
    }

    let accountsData
    try {
      accountsData = JSON.parse(errorText)
    } catch (e) {
      console.error('Failed to parse accounts response:', e)
      throw new Error('Invalid response from accounts API')
    }

    console.log('Accounts data:', accountsData)

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No accounts found')
    }

    // Get reviews using the Business Profile API
    const reviewsResponse = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${placeId}/reviews`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const reviewsErrorText = await reviewsResponse.text()
    console.log('Reviews API response:', {
      status: reviewsResponse.status,
      statusText: reviewsResponse.statusText,
      body: reviewsErrorText
    })

    if (!reviewsResponse.ok) {
      throw new Error(`Failed to fetch reviews: ${reviewsResponse.status} ${reviewsResponse.statusText} - ${reviewsErrorText}`)
    }

    let reviewsData
    try {
      reviewsData = JSON.parse(reviewsErrorText)
    } catch (e) {
      console.error('Failed to parse reviews response:', e)
      throw new Error('Invalid response from reviews API')
    }

    console.log(`Successfully fetched reviews for ${placeId}`)

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