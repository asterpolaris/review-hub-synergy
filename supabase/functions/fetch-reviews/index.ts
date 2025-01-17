import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placeId, accessToken } = await req.json();
    
    if (!placeId || !accessToken) {
      throw new Error('Missing required parameters');
    }

    console.log(`Fetching reviews for location: ${placeId}`);

    const locationName = placeId.startsWith('locations/') ? placeId : `locations/${placeId}`;
    const reviewsUrl = `https://mybusinessreviews.googleapis.com/v1/${locationName}/reviews`;
    
    console.log('Using API URL:', reviewsUrl);

    const response = await fetch(reviewsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('Google API response:', responseText);

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Successfully parsed reviews:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-reviews function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});