
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

    const { access_token, location_names, pageToken } = JSON.parse(requestBody);
    console.log('Processing request for locations:', location_names);
    console.log('Page token:', pageToken);

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

    const accountName = accountsData.accounts[0].name;
    console.log('Using account:', accountName);

    // Format location names with account prefix
    const formattedLocationNames = location_names.map(locationId => {
      // If locationId already contains the full path, use it as is
      if (locationId.startsWith('accounts/')) {
        return locationId;
      }
      // If locationId is just the ID number, format it properly
      const cleanLocationId = locationId.replace('locations/', '');
      return `${accountName}/locations/${cleanLocationId}`;
    });

    console.log('Formatted location names:', formattedLocationNames);

    // Use the batchGetReviews endpoint
    const batchReviewsUrl = `https://mybusiness.googleapis.com/v4/${accountName}/locations:batchGetReviews`;
    console.log('Making batch reviews request to:', batchReviewsUrl);

    const batchRequestBody = {
      locationNames: formattedLocationNames,
      pageSize: 50,
      pageToken: pageToken || undefined,
      ignoreRatingOnlyReviews: false,
      orderBy: 'updateTime desc'
    };
    console.log('Batch reviews request body:', batchRequestBody);

    const reviewsResponse = await fetch(
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

    const responseStatus = reviewsResponse.status;
    let errorMessage = null;

    if (!reviewsResponse.ok) {
      errorMessage = await reviewsResponse.text();
      console.error('Error response from batch reviews endpoint:', {
        status: responseStatus,
        statusText: reviewsResponse.statusText,
        response: errorMessage
      });

      await supabaseAdmin
        .from('review_fetch_logs')
        .insert({
          location_name: 'batch_request',
          review_count: 0,
          response_status: responseStatus,
          error_message: errorMessage
        });

      throw new Error(`Failed to fetch reviews: ${responseStatus} ${errorMessage}`);
    }

    const reviewsData = await reviewsResponse.json();
    console.log('Reviews response:', {
      locationReviewsCount: reviewsData.locationReviews ? reviewsData.locationReviews.length : 0,
      firstLocationReviewCount: reviewsData.locationReviews?.[0]?.reviews?.length || 0,
      nextPageToken: reviewsData.nextPageToken
    });

    // Log successful fetch
    await supabaseAdmin
      .from('review_fetch_logs')
      .insert({
        location_name: 'batch_request',
        review_count: reviewsData.locationReviews?.reduce((total: number, loc: any) => 
          total + (loc.reviews?.length || 0), 0) || 0,
        response_status: responseStatus,
        error_message: null
      });

    return new Response(
      JSON.stringify({ 
        locationReviews: reviewsData.locationReviews || [],
        nextPageToken: reviewsData.nextPageToken 
      }),
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
