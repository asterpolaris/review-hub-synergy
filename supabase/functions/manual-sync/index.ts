
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }
    
    // Verify the JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: verificationError } = await supabase.auth.getUser(token)
    
    if (verificationError || !user) {
      throw new Error('Invalid token')
    }
    
    // Parse request body
    const { businessId } = await req.json()
    
    if (!businessId) {
      throw new Error('Business ID is required')
    }
    
    // Check if user owns the business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()
    
    if (businessError || !business) {
      throw new Error('Business not found or you do not have permission')
    }
    
    // Call the sync-reviews function
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ businessId })
    })
    
    if (!syncResponse.ok) {
      const errorText = await syncResponse.text()
      throw new Error(`Failed to sync reviews: ${syncResponse.status} ${errorText}`)
    }
    
    const result = await syncResponse.json()
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in manual-sync function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
