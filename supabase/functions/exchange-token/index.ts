import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCTION_URL = 'https://review-hub-synergy.lovable.app';

serve(async (req) => {
  console.log('Exchange token function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody));
    
    const { code } = requestBody;
    if (!code) {
      throw new Error('No authorization code provided in request body');
    }
    console.log('Authorization code extracted from request');
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    console.log('OAuth credentials check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    });

    if (!clientId || !clientSecret) {
      console.error('Missing OAuth credentials');
      throw new Error('OAuth configuration is incomplete');
    }

    const redirectUri = `${PRODUCTION_URL}/auth/callback`;
    console.log('Using redirect URI:', redirectUri);
    
    // Exchange the authorization code for tokens
    console.log('Initiating token exchange request to Google...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    console.log('Token exchange response status:', tokenResponse.status);
    const data = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange error response:', JSON.stringify(data));
      throw new Error(data.error_description || data.error || 'Failed to exchange token');
    }

    console.log('Token exchange successful, access token received:', !!data.access_token);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully exchanged token',
        debug: {
          tokenReceived: !!data.access_token,
          timestamp: new Date().toISOString(),
          responseStatus: tokenResponse.status
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in exchange-token function:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to exchange authorization code for tokens',
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});