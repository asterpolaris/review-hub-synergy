import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

console.log('Reviews batch function loaded');

serve(async (req) => {
  console.log('Reviews batch function called');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);

    const { access_token, location_names } = JSON.parse(requestBody);
    console.log('Parsed request parameters:', {
      hasAccessToken: !!access_token,
      locationNames: location_names,
      accessTokenPreview: access_token ? `${access_token.substring(0, 10)}...` : 'none'
    });

    if (!access_token || !location_names) {
      console.error('Missing required parameters:', { 
        hasAccessToken: !!access_token, 
        hasLocationNames: !!location_names 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // First get the account ID
    console.log('Fetching Google Business accounts...');
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
      console.error('Error response from accounts endpoint:', {
        status: accountsResponse.status,
        statusText: accountsResponse.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status} ${errorText}`);
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
    console.log('Making batch reviews request to:', batchReviewsUrl);
    console.log('With location names:', location_names);

    const batchRequestBody = {
      locationNames: location_names,
      pageSize: 50,
      ignoreRatingOnlyReviews: false
    };
    console.log('Batch reviews request body:', batchRequestBody);

    const response = await fetch(
      batchReviewsUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(batchRequestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from batch reviews endpoint:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to fetch reviews: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw response from batch reviews endpoint:', data);

    // Transform the response to match the expected format
    const locationReviews = data.locationReviews || [];
    console.log('Transformed location reviews:', locationReviews);

    return new Response(
      JSON.stringify({ locationReviews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in batch reviews function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})