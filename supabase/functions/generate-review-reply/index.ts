import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const venueDescriptions = {
  "YOKO Luna": {
    long: "Housed within dreamlike environments, Yoko Luna merges fine dining with nightlife. Features neo-tokyo inspired nightclub, international DJs, performance dancers, aerialists, and specialty acts. Located at 1234 De La Montagne with eight distinct areas.",
    short: "Canada's premier destination for dining and nightlife. Nikkei cuisine and Neo-Tokyo inspired nightlife in downtown Montreal.",
    style: "Elegant and professional, with a focus on creating memorable experiences. Responses should be warm and inviting while maintaining sophistication."
  },
  "Bord'Elle Boutique Bar & Eatery": {
    long: "A 1920s-inspired venue celebrating glitz and glamour in Old Montréal. Combines European boutique hotel sophistication with high-energy nightlife, featuring creative cuisine, world-class burlesque, aerial performances, and flapper girls.",
    short: "1920's inspired boutique bar & burlesque club with international cuisine and live performances in Old Montreal.",
    style: "Enthusiastic and personal, with a touch of vintage charm. Responses should convey excitement and gratitude while maintaining professionalism."
  },
  "MUZIQUE": {
    long: "Montreal's famous club since 2009 with two distinct rooms featuring local and international DJs playing house and hip hop. Includes a rooftop terrace bar for warmer nights.",
    short: "Montreal's most famous club & rooftop since 2009.",
    style: "Direct and professional, focusing on the nightlife experience. Responses should be concise while showing appreciation for feedback."
  },
  "HANG Bar": {
    long: "An upscale Vietnamese culinary and mixology experience. Features DIY mixology platters, specialty cocktails with Vietnamese spices, and a vibrant atmosphere that transports guests to Vietnam.",
    short: "Haute-Viet dining and mixology bar in Old Montreal, blending refined cuisine with sophisticated nightlife.",
    style: "Personal and warm, with attention to detail. Responses should reflect the intimate nature of the venue while maintaining professionalism."
  },
  "THE FARSIDES": {
    long: "Thai-American Restaurant & Tiki Bar in Old Montreal combining upscale dining with hip hop culture. Features contemporary street art, creative cocktails, and nightly DJs.",
    short: "Thai-American restaurant and tiki bar with 80s/90s hip-hop vibes in Old Montreal.",
    style: "Casual yet professional, with a focus on community. Responses should feel authentic and personal while addressing concerns thoroughly."
  },
  "THE FARSIDES BROSSARD": {
    long: "Thai-American Restaurant & Tiki Bar inspired by hip hop & pop culture from the 80's & 90's. Features street art, graffiti-inspired decor, and nightly DJs at Solar Uniquartier.",
    short: "Thai-American restaurant and tiki bar with 80s/90s hip-hop inspiration in Brossard.",
    style: "Casual yet professional, with a focus on community. Responses should feel authentic and personal while addressing concerns thoroughly."
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { review } = await req.json()
    
    // Get venue info
    const venueInfo = venueDescriptions[review.venueName as keyof typeof venueDescriptions];
    if (!venueInfo) {
      throw new Error(`Venue ${review.venueName} not found in templates`);
    }

    // Determine if it's a negative review
    const isNegative = review.rating <= 3;
    
    console.log('Generating response for review:', {
      venueName: review.venueName,
      rating: review.rating,
      isNegative,
      reviewerName: review.authorName
    });

    // Construct the prompt for Claude
    const prompt = `You are a professional customer service representative for ${review.venueName}. 
    
Venue description: ${venueInfo.long}

Writing style: ${venueInfo.style}

You are responding to a ${review.rating}-star review from ${review.authorName}. 
Their review: "${review.comment}"

Write a response that:
${isNegative ? `
- Shows genuine concern and apologizes for their experience
- Acknowledges specific issues mentioned in their review
- Offers a way to make things right
- Maintains professionalism while showing empathy` 
: `
- Shows genuine appreciation for their positive feedback
- References specific aspects they enjoyed
- Maintains the venue's unique voice while being professional
- Invites them to return`}

Keep the response concise but genuine. Do not use generic templates - make it personal to their specific review.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', await response.text());
      throw new Error('Failed to generate response');
    }

    const claudeResponse = await response.json();
    const generatedReply = claudeResponse.content[0].text;

    console.log('Generated response:', generatedReply);

    return new Response(
      JSON.stringify({ reply: generatedReply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})