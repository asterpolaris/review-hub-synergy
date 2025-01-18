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

    // Fetch reviews for each location
    const locationReviews = [];
    for (const locationName of location_names) {
      try {
        const reviewsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}/reviews?pageSize=10`;
        console.log('Fetching reviews from:', reviewsUrl);

        const reviewsResponse = await fetch(reviewsUrl, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!reviewsResponse.ok) {
          console.error(`Failed to fetch reviews for location ${locationName}:`, {
            status: reviewsResponse.status,
            statusText: reviewsResponse.statusText
          });
          const errorText = await reviewsResponse.text();
          console.error('Error response:', errorText);
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
    console.log('Location reviews:', locationReviews);

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