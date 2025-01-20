import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reviewId, comment, placeId } = await req.json()
    
    if (!reviewId || !comment || !placeId) {
      throw new Error('Missing required parameters')
    }

    console.log('Replying to review:', {
      reviewId,
      placeId,
      commentPreview: comment.substring(0, 50) + '...'
    });

    // Extract the account and location IDs from the placeId
    const locationId = placeId.split('/').pop();
    
    // First get the account ID
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': req.headers.get('Authorization') || '',
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

    const accountId = accountsData.accounts[0].name.split('/')[1];
    console.log('Using account ID:', accountId);

    // Post the reply using the Google Business Profile API
    const replyUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${reviewId}/reply`;
    console.log('Posting reply to:', replyUrl);

    const response = await fetch(replyUrl, {
      method: 'PUT',
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        comment: comment
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from reply endpoint:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to post reply: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Reply posted successfully:', data);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in reply-to-review function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})