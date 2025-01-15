import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCTION_URL = 'https://review-hub-synergy.lovable.app';

serve(async (req) => {
  console.log('Exchange token function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    console.log('Received authorization code:', code ? 'Present' : 'Missing');
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing OAuth credentials');
      throw new Error('OAuth configuration is incomplete');
    }

    const redirectUri = `${PRODUCTION_URL}/auth/callback`;
    console.log('Using redirect URI:', redirectUri);
    
    // Exchange the authorization code for tokens
    console.log('Initiating token exchange...');
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

    const data = await tokenResponse.json();
    console.log('Token exchange response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.error('Token exchange error:', data);
      throw new Error(data.error_description || data.error || 'Failed to exchange token');
    }

    console.log('Token exchange successful');
    
    // Here you would typically store the tokens securely
    // For now, we'll just return success
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Successfully exchanged token',
        debug: {
          tokenReceived: !!data.access_token,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in exchange-token function:', error);
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