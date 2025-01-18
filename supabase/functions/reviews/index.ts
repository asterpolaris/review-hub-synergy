import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    // Get user's Google token
    const { data: googleToken, error: tokenError } = await supabase
      .from('google_auth_tokens')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !googleToken) {
      throw new Error('No Google token found')
    }

    // Check if token is expired
    if (new Date(googleToken.expires_at) <= new Date()) {
      throw new Error('Google token expired')
    }

    // Get user's businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('google_place_id, name')
      .eq('user_id', user.id)

    if (businessError) {
      throw businessError
    }

    return new Response(
      JSON.stringify({
        access_token: googleToken.access_token,
        businesses: businesses
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in reviews function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('token') ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})