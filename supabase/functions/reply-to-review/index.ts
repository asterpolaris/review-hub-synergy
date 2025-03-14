
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
    const { reviewId, comment, placeId } = await req.json()
    
    if (!reviewId || !comment || !placeId) {
      throw new Error('Missing required parameters')
    }
    
    // Get the Google auth token
    const { data: googleToken, error: tokenError } = await supabase
      .from('google_auth_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single()
      
    if (tokenError || !googleToken) {
      throw new Error('Google token not found')
    }

    // Get the account ID
    const accountsResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      {
        headers: {
          'Authorization': `Bearer ${googleToken.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )
    
    if (!accountsResponse.ok) {
      throw new Error(`Failed to fetch accounts: ${accountsResponse.status}`)
    }
    
    const accountsData = await accountsResponse.json()
    
    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      throw new Error('No Google Business accounts found')
    }
    
    const accountId = accountsData.accounts[0].name
    
    // Clean up IDs
    const cleanLocationId = placeId.replace(/^locations\//, '')
    
    // Create the reply URL
    const replyUrl = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${cleanLocationId}/reviews/${reviewId}/reply`
    
    console.log(`Sending reply to: ${replyUrl}`)
    
    // Send the reply to Google
    const replyResponse = await fetch(replyUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${googleToken.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        comment: comment
      })
    })
    
    if (!replyResponse.ok) {
      const errorText = await replyResponse.text()
      throw new Error(`Failed to reply to review: ${replyResponse.status} ${errorText}`)
    }
    
    const replyData = await replyResponse.json()
    
    // Update the review sync status in the database
    await supabase
      .from('reviews')
      .update({
        reply: comment,
        reply_time: new Date().toISOString(),
        sync_status: 'synced'
      })
      .eq('google_review_id', reviewId)
    
    return new Response(
      JSON.stringify({
        message: 'Reply submitted successfully',
        replyData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in reply-to-review function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
