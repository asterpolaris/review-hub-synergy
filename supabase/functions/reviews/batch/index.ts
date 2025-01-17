import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../../_shared/cors.ts"

serve(async (req) => {
  console.log('Reviews batch function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { access_token, locationNames } = await req.json()
    console.log('Received request with locationNames:', locationNames);

    if (!access_token || !locationNames) {
      console.error('Missing required parameters:', { access_token: !!access_token, locationNames: !!locationNames });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching accounts with access token:', access_token.substring(0, 10) + '...');

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
    );

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('Error fetching accounts:', errorText);
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${accountsResponse.statusText}`);
    }

    const accountsData = await accountsResponse.json();
    console.log("Google accounts response:", accountsData);

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      console.error('No Google Business accounts found');
      throw new Error('No Google Business accounts found');
    }

    const accountId = accountsData.accounts[0].name;
    console.log('Using account ID:', accountId);

    // Fetch reviews using batchGetReviews endpoint
    const batchReviewsUrl = `https://mybusiness.googleapis.com/v4/${accountId}/locations:batchGetReviews`;
    console.log('Making request to:', batchReviewsUrl);

    const response = await fetch(
      batchReviewsUrl,
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
    );

    console.log('Batch reviews request URL:', batchReviewsUrl);
    console.log('Batch reviews request body:', {
      locationNames,
      pageSize: 50,
      ignoreRatingOnlyReviews: false
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from Google API:', errorText);
      throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw response from Google API:', data);

    // Transform the response to match the expected format
    const locationReviews = data.locationReviews || [];
    console.log('Transformed location reviews:', locationReviews);

    return new Response(
      JSON.stringify({ locationReviews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in batch reviews function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})