import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCTION_URL = 'https://review-hub-synergy.lovable.app';

serve(async (req) => {
  // Log the full request details
  console.log('Exchange token function called');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Received request body:', JSON.stringify(requestBody));
    
    const { code } = requestBody;
    if (!code) {
      console.error('No authorization code provided');
      throw new Error('No authorization code provided in request body');
    }
    console.log('Authorization code received:', code);
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    console.log('OAuth credentials check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length,
      secretLength: clientSecret?.length
    });

    if (!clientId || !clientSecret) {
      console.error('Missing OAuth credentials');
      throw new Error('OAuth configuration is incomplete');
    }

    const redirectUri = `${PRODUCTION_URL}/auth/callback`;
    console.log('Using redirect URI:', redirectUri);
    
    // Exchange the authorization code for tokens
    console.log('Preparing token exchange request...');
    const tokenRequestBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    
    console.log('Making token exchange request to Google...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody,
    });

    console.log('Token exchange response status:', tokenResponse.status);
    const data = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: data
      });
      throw new Error(data.error_description || data.error || 'Failed to exchange token');
    }

    console.log('Token exchange successful');
    console.log('Access token received:', !!data.access_token);
    console.log('Token type:', data.token_type);
    console.log('Expires in:', data.expires_in);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully exchanged token',
        debug: {
          tokenReceived: !!data.access_token,
          timestamp: new Date().toISOString(),
          responseStatus: tokenResponse.status,
          tokenType: data.token_type,
          expiresIn: data.expires_in
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