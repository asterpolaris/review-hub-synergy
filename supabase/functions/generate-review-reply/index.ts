import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { review } = await req.json()

    // Determine response length based on rating and review length
    const isNegative = review.rating <= 3;
    const isLongReview = review.comment.length > 200;
    let maxTokens = 400; // Default length

    if (isNegative) {
      maxTokens = isLongReview ? 800 : 600; // Longer responses for negative reviews
    } else {
      maxTokens = isLongReview ? 600 : 400; // Shorter responses for positive reviews
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: `You are responding as ${review.venueName}. Generate a professional and friendly response to this customer review.
          
          Business Context:
          - You are ${review.venueName}, known for providing excellent customer service
          - You value customer feedback and take all reviews seriously
          - You aim to maintain a professional yet warm tone in all communications
          
          Review: ${review.comment}
          Rating: ${review.rating}/5
          
          Guidelines:
          - ${isNegative ? 'Show genuine empathy and provide specific solutions' : 'Express sincere gratitude and highlight mentioned positives'}
          - Keep the tone ${isNegative ? 'understanding and solution-focused' : 'warm and appreciative'}
          - Length: ${isNegative ? 'Be thorough but concise' : 'Keep it brief but meaningful'}
          - Thank them for their feedback
          - Address specific points they mentioned
          - If rating is low (3 or below):
            * Show genuine understanding of their concerns
            * Explain how you'll address specific issues
            * Provide a way for them to follow up if needed
          - If rating is high (4 or 5):
            * Express genuine appreciation
            * Reinforce positive experiences
            * Warmly invite them back
          - End with a professional closing
          ${isLongReview ? '- Address multiple points they raised in their detailed review' : '- Focus on their main point concisely'}
          - Maximum ${isNegative ? '2-3' : '1-2'} paragraphs`
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