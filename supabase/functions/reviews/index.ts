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

    // Get user's businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('google_place_id, name')
      .eq('user_id', user.id)

    if (businessError) {
      throw businessError
    }

    // Get user's Google token
    const { data: googleToken, error: tokenError } = await supabase
      .from('google_auth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !googleToken) {
      throw new Error('No Google token found')
    }

    // Fetch reviews for each business
    const allReviews = []
    for (const business of businesses) {
      const response = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${business.google_place_id}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${googleToken.access_token}`,
          },
        }
      )

      if (!response.ok) {
        console.error(`Failed to fetch reviews for ${business.name}:`, await response.text())
        continue
      }

      const data = await response.json()
      const reviews = data.reviews || []
      allReviews.push(
        ...reviews.map((review: any) => ({
          ...review,
          venueName: business.name,
          placeId: business.google_place_id,
        }))
      )
    }

    // Sort by date and limit to 100
    const sortedReviews = allReviews
      .sort((a: any, b: any) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      .slice(0, 100)

    return new Response(JSON.stringify(sortedReviews), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in reviews function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})