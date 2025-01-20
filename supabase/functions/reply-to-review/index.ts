import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
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
    })

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: verificationError } = await supabaseAdmin.auth.getUser(token)
    
    if (verificationError || !user) {
      throw new Error('Invalid token')
    }

    // Parse request body
    const { reviewId, comment, placeId } = await req.json()
    
    if (!reviewId || !comment || !placeId) {
      throw new Error('Missing required parameters')
    }

    // Get user's Google token
    const { data: googleToken, error: tokenError } = await supabaseAdmin
      .from('google_auth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !googleToken?.access_token) {
      throw new Error('No Google token found')
    }

    // Post reply to Google Business Profile API
    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${placeId}/reviews/${reviewId}/reply`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${googleToken.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comment
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to post reply: ${errorText}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in reply-to-review function:', error)
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