
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('Cron sync reviews function loaded');

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting cron sync for reviews...')
    
    // Call the trigger_reviews_sync database function
    const { data, error } = await supabase.rpc('trigger_reviews_sync')
    
    if (error) {
      throw new Error(`Failed to trigger sync: ${error.message}`)
    }
    
    console.log('Successfully triggered review sync')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Reviews sync triggered successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in cron-sync-reviews function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
