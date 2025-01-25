import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'admin_notification' | 'user_approved' | 'user_rejected';
  email: string;
  registrationId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, email, registrationId } = await req.json() as EmailRequest
    
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let subject = ''
    let content = ''

    switch (type) {
      case 'admin_notification':
        subject = 'New Registration Pending Approval'
        content = `A new user has registered and is waiting for approval. Please review their application.`
        break
      case 'user_approved':
        subject = 'Your Registration Has Been Approved'
        content = `Your registration has been approved. You can now log in to your account.`
        break
      case 'user_rejected':
        subject = 'Registration Status Update'
        content = `We regret to inform you that your registration request has been declined.`
        break
    }

    // Here you would integrate with your email service (e.g., Resend)
    // For now, we'll just log the email
    console.log(`Would send email:
      To: ${email}
      Subject: ${subject}
      Content: ${content}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})