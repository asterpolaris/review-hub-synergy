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

    console.log(`Starting review fetch process for place ID: ${placeId}`)

    // First get the account ID
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!accountsResponse.ok) {
      console.error('Failed to fetch accounts:', {
        status: accountsResponse.status,
        statusText: accountsResponse.statusText,
        body: await accountsResponse.text()
      })
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText}`)
    }

    const accountsData = await accountsResponse.json()
    console.log('Accounts data:', accountsData)

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No accounts found')
    }

    const accountId = accountsData.accounts[0].name
    console.log(`Using account ID: ${accountId}`)

    // Extract location ID from placeId
    const locationId = placeId.split('/').pop()
    if (!locationId) {
      throw new Error('Invalid location ID format')
    }

    // Fetch reviews using the Business Profile API v4 endpoint
    const reviewsResponse = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations/${locationId}/reviews`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!reviewsResponse.ok) {
      console.error('Failed to fetch reviews:', {
        status: reviewsResponse.status,
        statusText: reviewsResponse.statusText,
        body: await reviewsResponse.text()
      })
      throw new Error(`Failed to fetch reviews: ${reviewsResponse.status} ${reviewsResponse.statusText}`)
    }

    const reviewsData = await reviewsResponse.json()
    console.log(`Successfully fetched reviews for ${placeId}`)

    return new Response(
      JSON.stringify(reviewsData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
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