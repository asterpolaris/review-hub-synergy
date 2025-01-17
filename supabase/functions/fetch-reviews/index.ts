import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  placeId: string;
  accessToken: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placeId, accessToken } = await req.json() as RequestBody;
    
    if (!placeId || !accessToken) {
      throw new Error('Missing required parameters');
    }

    console.log(`Fetching reviews for location: ${placeId}`);

    // Use the correct API endpoint format
    const reviewsUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${placeId}/reviews`;
    console.log('Using API URL:', reviewsUrl);

    const response = await fetch(reviewsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', {
        status: response.status,
        statusText: response.statusText,
        url: reviewsUrl,
        body: errorText
      });
      throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched reviews:', data);

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error) {
    console.error('Error in fetch-reviews function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})