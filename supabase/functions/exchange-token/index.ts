import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCTION_URL = 'https://review-hub-synergy.lovable.app';

serve(async (req) => {
  console.log('Function invoked - initial entry point');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body:', JSON.stringify(requestBody));
    
    const { code } = requestBody;
    if (!code) {
      console.error('No authorization code provided');
      throw new Error('No authorization code provided in request body');
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    console.log('OAuth credentials check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });

    if (!clientId || !clientSecret) {
      console.error('Missing OAuth credentials');
      return new Response(
        JSON.stringify({
          error: 'OAuth configuration is incomplete',
          details: 'Client ID or Client Secret is missing'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const redirectUri = `${PRODUCTION_URL}/auth/callback`;
    console.log('Using redirect URI:', redirectUri);
    
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

    const data = await tokenResponse.json();
    console.log('Token exchange response status:', tokenResponse.status);
    console.log('Token exchange response:', JSON.stringify(data));

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', {
        status: tokenResponse.status,
        error: data
      });
      return new Response(
        JSON.stringify({
          error: data.error,
          error_description: data.error_description,
          status: tokenResponse.status,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: tokenResponse.status 
        }
      );
    }

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
    console.error('Error in exchange-token function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to process token exchange request',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});