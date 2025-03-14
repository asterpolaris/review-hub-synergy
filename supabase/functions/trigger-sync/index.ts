
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
    console.log('Triggering sync process for businesses...')
    
    // Get businesses that need syncing (not synced in the last hour)
    const { data: businesses, error } = await supabase.rpc('trigger_reviews_sync')
    
    if (error) {
      throw new Error(`Failed to trigger sync: ${error.message}`)
    }
    
    console.log('Sync process initiated.')
    
    return new Response(
      JSON.stringify({ message: 'Sync process triggered successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in trigger-sync function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
