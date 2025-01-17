import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  placeId: string;
  accessToken: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { placeId, accessToken } = await req.json() as RequestBody;
    
    if (!placeId || !accessToken) {
      throw new Error('Missing required parameters');
    }

    console.log(`Fetching reviews for location: ${placeId}`);

    // First get the account ID
    const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const accountsData = await accountsResponse.json();
    console.log('Accounts response:', accountsData);

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No business accounts found');
    }

    const accountId = accountsData.accounts[0].name.split('/')[1];
    const locationId = placeId.split('/').pop();
    
    // Construct the correct reviews URL with account and location IDs
    const reviewsUrl = `https://mybusinessreviews.googleapis.com/v1/accounts/${accountId}/locations/${locationId}/reviews`;
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