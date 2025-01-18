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
    console.log('Processing request for locations:', location_names);

    if (!access_token || !location_names) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // First validate the access token
    try {
      const tokenInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${access_token}`
      );
      
      if (!tokenInfoResponse.ok) {
        console.error('Invalid access token:', await tokenInfoResponse.text());
        return new Response(
          JSON.stringify({ error: 'Invalid access token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error validating access token:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to validate access token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the account ID
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

    const locationReviews = [];
    for (const locationName of location_names) {
      try {
        // Use the correct API endpoint format with the account path
        const reviewsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}/reviews`;
        console.log('Fetching reviews from:', reviewsUrl);

        const reviewsResponse = await fetch(reviewsUrl, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!reviewsResponse.ok) {
          const errorText = await reviewsResponse.text();
          console.error(`Failed to fetch reviews for location ${locationName}:`, {
            status: reviewsResponse.status,
            statusText: reviewsResponse.statusText,
            response: errorText
          });
          continue; // Skip this location and continue with others
        }

        const reviewsData = await reviewsResponse.json();
        console.log(`Reviews data for location ${locationName}:`, reviewsData);
        
        locationReviews.push({
          locationName,
          reviews: reviewsData.reviews || []
        });
      } catch (error) {
        console.error(`Error processing location ${locationName}:`, error);
        // Continue with other locations even if one fails
        continue;
      }
    }

    console.log('Successfully fetched reviews for locations:', locationReviews.length);

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