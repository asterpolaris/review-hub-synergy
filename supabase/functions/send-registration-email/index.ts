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
    const { type, email } = await req.json() as EmailRequest
    
    let subject = ''
    let content = ''

    switch (type) {
      case 'admin_notification':
        subject = 'New Registration Pending Approval - Hospitality Desk'
        content = `A new user has registered and is waiting for approval. Please review their application in the admin dashboard.`
        break
      case 'user_approved':
        subject = 'Welcome to Hospitality Desk - Registration Approved'
        content = `Your registration has been approved! You can now log in to your account at https://hospitality-desk.com/login`
        break
      case 'user_rejected':
        subject = 'Hospitality Desk Registration Status'
        content = `We regret to inform you that your registration request has been declined. If you believe this was a mistake, please contact our support team.`
        break
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: "Hospitality Desk <no-reply@hospitality-desk.com>",
        to: [email],
        subject: subject,
        text: content,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Resend API error:', error)
      throw new Error('Failed to send email')
    }

    const data = await res.json()
    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-registration-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})