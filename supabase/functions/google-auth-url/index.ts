import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODUCTION_URL = 'https://jegantic-desk.netlify.app';

serve(async (req) => {
  console.log('Google auth URL function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    console.log('Client ID available:', !!clientId);
    
    if (!clientId) {
      console.error('GOOGLE_CLIENT_ID not configured');
      throw new Error('OAuth configuration missing');
    }

    // Always use the production URL for the redirect
    const redirectUri = `${PRODUCTION_URL}/auth/callback`;
    console.log('Using redirect URI:', redirectUri);
    
    // Explicitly specify all required scopes
    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];
    
    console.log('Using scopes:', scopes);
    const scope = encodeURIComponent(scopes.join(' '));

    const state = encodeURIComponent(JSON.stringify({
      returnTo: PRODUCTION_URL
    }));

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&state=${state}` +
      `&prompt=consent`;

    console.log('Generated auth URL (without sensitive data):', 
      authUrl.replace(clientId, 'REDACTED'));

    return new Response(
      JSON.stringify({ 
        url: authUrl,
        debug: {
          redirectUri,
          scopes,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in google-auth-url function:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Please ensure Google OAuth is properly configured and API access has been granted.',
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
