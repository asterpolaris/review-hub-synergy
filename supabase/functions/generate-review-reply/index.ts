import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { review } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Generate a professional and friendly response to this customer review. The response should address their feedback and maintain a positive tone.
          
          Review: ${review.comment}
          Rating: ${review.rating}/5
          
          Guidelines:
          - Be concise but thorough
          - Thank them for their feedback
          - Address specific points they mentioned
          - If rating is low, show empathy and commitment to improvement
          - If rating is high, express gratitude and invite them back
          - Keep a professional and friendly tone
          - Maximum 2-3 paragraphs`
        }]
      })
    });

    const data = await response.json();
    return new Response(
      JSON.stringify({ 
        reply: data.content[0].text 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})