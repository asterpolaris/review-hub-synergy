import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { access_token, businesses } = await req.json()

    if (!access_token) {
      return new Response(
        JSON.stringify({ error: 'Access token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // First get the account ID
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )

    if (!accountsResponse.ok) {
      const error = await accountsResponse.text()
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText}\nResponse: ${error}`)
    }

    const accountsData = await accountsResponse.json()
    
    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No Google Business accounts found')
    }

    const accountId = accountsData.accounts[0].name
    console.log('Using account ID:', accountId)

    // Prepare location names array for batch request
    const locationNames = businesses.map((business: any) => business.google_place_id)
    console.log('Location names for batch request:', locationNames)

    // Make batch request for reviews
    const batchResponse = await fetch(
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

    if (!batchResponse.ok) {
      const error = await batchResponse.text()
      throw new Error(`Failed to fetch reviews batch: ${error}`)
    }

    const batchData = await batchResponse.json()
    console.log('Batch reviews response:', batchData)

    return new Response(
      JSON.stringify(batchData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})