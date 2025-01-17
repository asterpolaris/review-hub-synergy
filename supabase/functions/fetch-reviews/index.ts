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

    // Get the place ID from the request URL
    const url = new URL(req.url)
    const placeId = url.searchParams.get('placeId')
    if (!placeId) {
      throw new Error('No place ID provided')
    }

    // Get the user's Google token
    const { data: googleToken, error: tokenError } = await supabase
      .from('google_auth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !googleToken) {
      throw new Error('No Google token found')
    }

    // Fetch reviews from Google API
    const response = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${placeId}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${googleToken.access_token}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Google API error:', await response.text())
      throw new Error('Failed to fetch reviews from Google')
    }

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in fetch-reviews function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})