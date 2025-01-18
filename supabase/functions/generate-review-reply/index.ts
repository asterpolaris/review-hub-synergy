import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const venueDescriptions = {
  "YOKO Luna": {
    long: "Housed within dreamlike environments, Yoko Luna merges fine dining with nightlife. Features neo-tokyo inspired nightclub, international DJs, performance dancers, aerialists, and specialty acts. Located at 1234 De La Montagne with eight distinct areas.",
    short: "Canada's premier destination for dining and nightlife. Nikkei cuisine and Neo-Tokyo inspired nightlife in downtown Montreal."
  },
  "Bord'Elle Boutique Bar & Eatery": {
    long: "A 1920s-inspired venue celebrating glitz and glamour in Old Montréal. Combines European boutique hotel sophistication with high-energy nightlife, featuring creative cuisine, world-class burlesque, aerial performances, and flapper girls.",
    short: "1920's inspired boutique bar & burlesque club with international cuisine and live performances in Old Montreal."
  },
  "MUZIQUE": {
    long: "Montreal's famous club since 2009 with two distinct rooms featuring local and international DJs playing house and hip hop. Includes a rooftop terrace bar for warmer nights.",
    short: "Montreal's most famous club & rooftop since 2009."
  },
  "HANG Bar": {
    long: "An upscale Vietnamese culinary and mixology experience. Features DIY mixology platters, specialty cocktails with Vietnamese spices, and a vibrant atmosphere that transports guests to Vietnam.",
    short: "Haute-Viet dining and mixology bar in Old Montreal, blending refined cuisine with sophisticated nightlife."
  },
  "THE FARSIDES BROSSARD": {
    long: "Thai-American Restaurant & Tiki Bar inspired by hip hop & pop culture from the 80's & 90's. Features street art, graffiti-inspired decor, and nightly DJs at Solar Uniquartier.",
    short: "Thai-American restaurant and tiki bar with 80s/90s hip-hop inspiration in Brossard."
  },
  "THE FARSIDES": {
    long: "Thai-American Restaurant & Tiki Bar in Old Montreal combining upscale dining with hip hop culture. Features contemporary street art, creative cocktails, and nightly DJs.",
    short: "Thai-American restaurant and tiki bar with 80s/90s hip-hop vibes in Old Montreal."
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { review } = await req.json()
    
    // Determine response length and model based on rating and review length
    const isNegative = review.rating <= 3;
    const isLongReview = review.comment.length > 200;
    
    // Use different models and token limits based on review sentiment
    const model = isNegative ? 'claude-3-sonnet-20240229' : 'claude-3-haiku-20240307';
    let maxTokens = isNegative ? 800 : 300; // Shorter responses for positive reviews
    
    // Adjust tokens based on review length
    if (isLongReview && isNegative) {
      maxTokens = 1000;
    } else if (isLongReview && !isNegative) {
      maxTokens = 400;
    }

    // Get venue description
    const venueInfo = venueDescriptions[review.venueName as keyof typeof venueDescriptions] || {
      long: review.venueName,
      short: review.venueName
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{
          role: 'user',
          content: `You are responding as ${review.venueName}. Generate a professional response to this customer review.
          
          Business Context:
          ${isNegative ? venueInfo.long : venueInfo.short}
          
          Review: ${review.comment}
          Rating: ${review.rating}/5
          
          Guidelines:
          - ${isNegative ? 'Address concerns directly and provide solutions' : 'Be brief and appreciative'}
          - Keep the tone ${isNegative ? 'professional and solution-focused' : 'warm but concise'}
          - Length: ${isNegative ? 'Thorough but focused' : 'Brief and direct'}
          ${isNegative ? `
          - Address specific issues
          - Provide clear solutions
          - Include follow-up contact if needed
          - Maximum 2-3 paragraphs
          ` : `
          - Thank them briefly
          - Mention one specific positive point
          - Quick invitation to return
          - Maximum 1 short paragraph
          `}`
        }]
      })
    });

    const data = await response.json();
    return new Response(
      JSON.stringify({ reply: data.content[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})