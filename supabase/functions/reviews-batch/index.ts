
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

    const { access_token, location_names, page_tokens } = JSON.parse(requestBody);
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
    
    // Get the businesses
    const { data: businesses, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, google_place_id')
      .in('google_place_id', location_names);
      
    if (businessError) {
      console.error('Error fetching businesses:', businessError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch businesses', details: businessError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no businesses found or reviews in database, proceed with the original API fetch
    if (!businesses || businesses.length === 0) {
      console.log('No businesses found, proceeding with original API call');
      
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
      const nextPageTokens = {};

      for (let i = 0; i < location_names.length; i++) {
        const locationId = location_names[i];
        try {
          // Clean up the location ID by removing any duplicate "locations/" prefix
          const cleanLocationId = locationId.replace(/^locations\//, '');
          
          // Use the correct Business Profile API endpoint for reviews
          const reviewsUrl = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${cleanLocationId}/reviews`;
          console.log('Fetching reviews from:', reviewsUrl);

          // Add page token to URL if it exists for this location
          const pageToken = page_tokens?.[locationId];
          const urlWithParams = new URL(reviewsUrl);
          urlWithParams.searchParams.append('pageSize', '50');
          if (pageToken) {
            urlWithParams.searchParams.append('pageToken', pageToken);
          }

          const reviewsResponse = await fetch(urlWithParams.toString(), {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (!reviewsResponse.ok) {
            const errorText = await reviewsResponse.text();
            console.error(`Failed to fetch reviews for location ${cleanLocationId}:`, {
              status: reviewsResponse.status,
              statusText: reviewsResponse.statusText,
              response: errorText
            });
            continue;
          }

          const reviewsData = await reviewsResponse.json();
          console.log(`Reviews data for location ${cleanLocationId}:`, reviewsData);
          
          // Validate and normalize timestamps for all reviews
          if (reviewsData.reviews) {
            reviewsData.reviews.forEach((review: any) => {
              // Log the raw date for debugging
              console.log(`Review ${review.reviewId} raw createTime:`, review.createTime);
              
              // Ensure the date is properly formatted as ISO string
              try {
                // This will throw an error if the date is invalid
                new Date(review.createTime).toISOString();
              } catch (e) {
                console.error(`Invalid date format for review ${review.reviewId}:`, review.createTime);
                // Set a fallback date if the original is invalid
                review.createTime = new Date().toISOString();
              }
              
              // Do the same for reply dates if present
              if (review.reviewReply && review.reviewReply.createTime) {
                try {
                  new Date(review.reviewReply.createTime).toISOString();
                } catch (e) {
                  console.error(`Invalid reply date format for review ${review.reviewId}:`, review.reviewReply.createTime);
                  review.reviewReply.createTime = new Date().toISOString();
                }
              }
              
              // Store the review in the database for future cached access
              const businessId = businesses.find(b => b.google_place_id === locationId)?.id;
              if (businessId) {
                supabaseAdmin
                  .from('reviews')
                  .upsert({
                    google_review_id: review.reviewId,
                    business_id: businessId,
                    author_name: review.reviewer.displayName,
                    rating: review.starRating,
                    comment: review.comment || null,
                    create_time: new Date(review.createTime).toISOString(),
                    reply: review.reviewReply?.comment || null,
                    reply_time: review.reviewReply?.createTime ? new Date(review.reviewReply.createTime).toISOString() : null,
                    photo_urls: review.reviewPhotos?.map((photo: any) => photo.photoUri) || null,
                    sync_status: 'synced',
                    google_sync_source: true
                  }, {
                    onConflict: 'google_review_id',
                    ignoreDuplicates: false
                  })
                  .then(({ error }) => {
                    if (error) {
                      console.error(`Error storing review ${review.reviewId}:`, error);
                    }
                  });
              }
            });
          }
          
          locationReviews.push({
            locationName: locationId,
            reviews: reviewsData.reviews || []
          });

          // Store next page token if it exists
          if (reviewsData.nextPageToken) {
            nextPageTokens[locationId] = reviewsData.nextPageToken;
          }
          
          // Update the last_synced_at timestamp for the business
          const businessId = businesses.find(b => b.google_place_id === locationId)?.id;
          if (businessId) {
            await supabaseAdmin
              .from('businesses')
              .update({ last_synced_at: new Date().toISOString() })
              .eq('id', businessId);
              
            // Log the sync operation
            await supabaseAdmin
              .from('review_sync_logs')
              .insert({
                business_id: businessId,
                successful: true,
                reviews_fetched: reviewsData.reviews?.length || 0,
                reviews_processed: reviewsData.reviews?.length || 0
              });
          }
        } catch (error) {
          console.error(`Error processing location ${locationId}:`, error);
          continue;
        }
      }

      console.log('Successfully fetched reviews for locations:', locationReviews.length);
      console.log('Next page tokens:', nextPageTokens);

      return new Response(
        JSON.stringify({ 
          locationReviews,
          nextPageTokens 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // We have businesses in the database, fetch reviews from the database instead
      console.log('Fetching reviews from database for businesses:', businesses.map(b => b.id));
      
      const locationReviews = [];
      
      for (const business of businesses) {
        try {
          // Get reviews for this business from the database
          const { data: reviews, error: reviewsError } = await supabaseAdmin
            .from('reviews')
            .select('*')
            .eq('business_id', business.id)
            .order('create_time', { ascending: false });
            
          if (reviewsError) {
            console.error(`Error fetching reviews for business ${business.id}:`, reviewsError);
            continue;
          }
          
          console.log(`Found ${reviews.length} reviews in database for business ${business.id}`);
          
          // Transform database reviews to the format expected by the client
          const transformedReviews = reviews.map(review => ({
            reviewId: review.google_review_id,
            reviewer: {
              displayName: review.author_name
            },
            starRating: review.rating,
            comment: review.comment || '',
            createTime: review.create_time,
            reviewPhotos: review.photo_urls ? review.photo_urls.map((url: string) => ({ photoUri: url })) : [],
            reviewReply: review.reply ? {
              comment: review.reply,
              createTime: review.reply_time
            } : undefined
          }));
          
          locationReviews.push({
            locationName: business.google_place_id,
            reviews: transformedReviews
          });
        } catch (error) {
          console.error(`Error processing reviews for business ${business.id}:`, error);
          continue;
        }
      }
      
      console.log('Successfully fetched cached reviews for locations:', locationReviews.length);
      
      return new Response(
        JSON.stringify({ 
          locationReviews,
          nextPageTokens: {} // No pagination needed for cached reviews
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
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
