
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Reviews batch function loaded');

Deno.serve(async (req) => {
  console.log('Reviews batch function called');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
    });

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verificationError } = await supabaseAdmin.auth.getUser(token);
    
    if (verificationError || !user) {
      console.error('Token verification failed:', verificationError);
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: verificationError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token verified for user:', user.id);

    // Parse request body
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);

    const { access_token, location_names } = JSON.parse(requestBody);
    console.log('Processing request for locations:', location_names);

    if (!access_token || !location_names) {
      console.error('Missing required parameters:', { 
        hasAccessToken: !!access_token, 
        hasLocationNames: !!location_names 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    const locationReviews = [];
    for (const locationId of location_names) {
      try {
        // Clean up the location ID by removing any duplicate "locations/" prefix
        const cleanLocationId = locationId.replace(/^locations\//, '');
        
        // Build the reviews URL with parameters for 100 reviews
        const reviewsUrl = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${cleanLocationId}/reviews`;
        const params = new URLSearchParams({
          pageSize: '100',  // Request 100 reviews
          orderBy: 'updateTime desc'  // Get the most recent reviews
        });
        const fullUrl = `${reviewsUrl}?${params.toString()}`;
        console.log('Fetching reviews from:', fullUrl);

        const reviewsResponse = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        const responseStatus = reviewsResponse.status;
        let errorMessage = null;

        if (!reviewsResponse.ok) {
          errorMessage = await reviewsResponse.text();
          console.error(`Failed to fetch reviews for location ${cleanLocationId}:`, {
            status: responseStatus,
            statusText: reviewsResponse.statusText,
            response: errorMessage
          });

          // Log the error to our new logging table
          await supabaseAdmin
            .from('review_fetch_logs')
            .insert({
              location_name: locationId,
              review_count: 0,
              response_status: responseStatus,
              error_message: errorMessage
            });

          continue;
        }

        const reviewsData = await reviewsResponse.json();
        console.log(`Reviews data for location ${cleanLocationId}:`, {
          totalReviewCount: reviewsData.reviews ? reviewsData.reviews.length : 0,
          hasNextPageToken: !!reviewsData.nextPageToken
        });
        
        // Log successful fetch to our logging table
        await supabaseAdmin
          .from('review_fetch_logs')
          .insert({
            location_name: locationId,
            review_count: reviewsData.reviews ? reviewsData.reviews.length : 0,
            response_status: responseStatus,
            error_message: null
          });
        
        locationReviews.push({
          locationName: locationId,
          reviews: reviewsData.reviews || []
        });
      } catch (error) {
        console.error(`Error processing location ${locationId}:`, error);
        
        // Log the error to our logging table
        await supabaseAdmin
          .from('review_fetch_logs')
          .insert({
            location_name: locationId,
            review_count: 0,
            response_status: 500,
            error_message: error.message
          });
        
        continue;
      }
    }

    console.log('Successfully fetched reviews for locations:', locationReviews.length);

    return new Response(
      JSON.stringify({ locationReviews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reviews-batch function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
