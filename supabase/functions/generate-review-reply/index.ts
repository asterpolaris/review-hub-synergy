import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const venueDescriptions = {
  "YOKO Luna": {
    long: "Housed within dreamlike environments, Yoko Luna merges fine dining with nightlife. Features neo-tokyo inspired nightclub, international DJs, performance dancers, aerialists, and specialty acts. Located at 1234 De La Montagne with eight distinct areas.",
    short: "Canada's premier destination for dining and nightlife. Nikkei cuisine and Neo-Tokyo inspired nightlife in downtown Montreal.",
    style: "Elegant and professional, with a focus on creating memorable experiences. Responses should be warm and inviting while maintaining sophistication.",
    examples: {
      positive: "Hi Jakub Pistol,\n\nThank you so much for your wonderful review! We're delighted to hear that you enjoyed your time with us at Yoko Luna. It means a lot to our team to know that we made your visit special.\n\nWe look forward to welcoming you back soon for another memorable experience.\n\nWarm regards,\nThe Yoko Luna Team",
      negative: "Hi Shaina\n\nThank you for sharing your feedback with us. We're sorry to hear that your experience at Yoko Luna didn't meet your expectations. Your comments about your recent visit are important to us, and we'll be discussing them with our team to make improvements.\n\nWe would appreciate the opportunity to make things right. Please feel free to reach out to us directly at concierge@yokoluna.com so we can address your concerns personally.\n\nSincerely,\nYoko Luna Management"
    }
  },
  "Bord'Elle Boutique Bar & Eatery": {
    long: "A 1920s-inspired venue celebrating glitz and glamour in Old Montréal. Combines European boutique hotel sophistication with high-energy nightlife, featuring creative cuisine, world-class burlesque, aerial performances, and flapper girls.",
    short: "1920's inspired boutique bar & burlesque club with international cuisine and live performances in Old Montreal.",
    style: "Enthusiastic and personal, with a touch of vintage charm. Responses should convey excitement and gratitude while maintaining professionalism.",
    examples: {
      positive: "Wow Kris! Thank you so much for taking the time to write this amazing review! We are so humbled and honoured. We hope to see you back again and again!!",
      negative: "Hello Julie,\n\nThank you for dining with us and sharing your feedback. We are sorry to hear about your disappointing evening. Our single purpose is to provide our clients with the most unforgettable experience, and it seems we fell short here.\n\nWe take this very serious, and as such, would you be open to discuss it? If so, please send us a short email detailing your evening using the following address: guestrelations@bordelle.ca.\n\nOur hope is that we can take your notes, suggestions and improve our service and provide you with a new opportunity to experience Bord'Elle as it was meant to be! We appreciate the fact that you chose to celebrate an evening with us and we look forward to hearing from you.\n\nThe Bord'Elle Team"
    }
  },
  "MUZIQUE": {
    long: "Montreal's famous club since 2009 with two distinct rooms featuring local and international DJs playing house and hip hop. Includes a rooftop terrace bar for warmer nights.",
    short: "Montreal's most famous club & rooftop since 2009.",
    style: "Direct and professional, focusing on the nightlife experience. Responses should be concise while showing appreciation for feedback.",
    examples: {
      positive: "We appreciate you taking the time to leave your feedback. It was a pleasure hosting you, and we look forward to welcoming you back again soon!",
      negative: "Thank you for sharing your feedback. We're truly sorry to hear that your experience did not meet your expectations. Our goal is always to provide a memorable night out for all our guests.\n\nWe would love the opportunity to make things right and learn more about what happened so we can address your concerns and improve. Please feel free to reach out to us directly at info@muziquemontreal.com and a member of our team will be happy to assist you. We value your input and hope to welcome you back for a much better experience in the future."
    }
  },
  "HANG Bar": {
    long: "An upscale Vietnamese culinary and mixology experience. Features DIY mixology platters, specialty cocktails with Vietnamese spices, and a vibrant atmosphere that transports guests to Vietnam.",
    short: "Haute-Viet dining and mixology bar in Old Montreal, blending refined cuisine with sophisticated nightlife.",
    style: "Personal and warm, with attention to detail. Responses should reflect the intimate nature of the venue while maintaining professionalism.",
    examples: {
      positive: "Hi Susan, thank you for your beautiful review. It was a pleasure having you.\n\n~ The Hang team",
      negative: "Hi Cheryl,\n\nThank you for taking the time to share your thoughts. We're truly sorry to hear that your evening didn't meet your expectations, as our goal is always to provide an unforgettable experience for our guests.\n\nWe value your feedback immensely and would love the opportunity to discuss your experience further. If you're open to it, please feel free to send us an email at karina@jegantic.com with a brief description of your evening, along with your name and phone number.\n\nYour insights are invaluable in helping us improve, and we'd love the chance to welcome you back for the experience you deserve. Thank you again for choosing to spend an evening with us—we look forward to hearing from you!\n\nWarm regards,\nHang Bar Team"
    }
  },
  "THE FARSIDES": {
    long: "Thai-American Restaurant & Tiki Bar in Old Montreal combining upscale dining with hip hop culture. Features contemporary street art, creative cocktails, and nightly DJs.",
    short: "Thai-American restaurant and tiki bar with 80s/90s hip-hop vibes in Old Montreal.",
    style: "Casual yet professional, with a focus on community. Responses should feel authentic and personal while addressing concerns thoroughly.",
    examples: {
      positive: "Thank you so much Daniel, for the visit and the review. We will share your message with our team. We hope to see you again soon.",
      negative: "Thank you for sharing your feedback with us. We are truly sorry to hear that your experience fell short of the high standards we strive to uphold. It is always our goal to provide an exceptional experience for all of our guests, and we deeply regret that this wasn't the case during your visit.\n\nPlease accept our sincerest apologies for the inconvenience and frustration your group encountered. We recognize that no guest should ever feel overlooked, regardless of how busy the evening may be.\n\nWe would greatly appreciate the opportunity to make things right. Kindly reach out to us directly at info@thefarsides.com at your earliest convenience, so we can learn more about your experience and ensure your next visit exceeds expectations.\n\nYour feedback is invaluable in helping us improve, and we hope to welcome you back soon.\n\nWarm regards,\nThe Farsides Family"
    }
  },
  "THE FARSIDES BROSSARD": {
    long: "Thai-American Restaurant & Tiki Bar inspired by hip hop & pop culture from the 80's & 90's. Features street art, graffiti-inspired decor, and nightly DJs at Solar Uniquartier.",
    short: "Thai-American restaurant and tiki bar with 80s/90s hip-hop inspiration in Brossard.",
    style: "Casual yet professional, with a focus on community. Responses should feel authentic and personal while addressing concerns thoroughly.",
    examples: {
      positive: "Thank you so much Daniel, for the visit and the review. We will share your message with our team. We hope to see you again soon.",
      negative: "Thank you for sharing your feedback with us. We are truly sorry to hear that your experience fell short of the high standards we strive to uphold. It is always our goal to provide an exceptional experience for all of our guests, and we deeply regret that this wasn't the case during your visit.\n\nPlease accept our sincerest apologies for the inconvenience and frustration your group encountered. We recognize that no guest should ever feel overlooked, regardless of how busy the evening may be.\n\nWe would greatly appreciate the opportunity to make things right. Kindly reach out to us directly at info@thefarsides.com at your earliest convenience, so we can learn more about your experience and ensure your next visit exceeds expectations.\n\nYour feedback is invaluable in helping us improve, and we hope to welcome you back soon.\n\nWarm regards,\nThe Farsides Family"
    }
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

Here is an example of how we've responded to ${isNegative ? 'negative' : 'positive'} reviews in the past (use this as inspiration for tone and style, but do not copy verbatim):

${isNegative ? venueInfo.examples.negative : venueInfo.examples.positive}

You are responding to a ${review.rating}-star review from ${review.authorName}. 
Their review: "${review.comment}"

Write a unique response that:
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

Keep the response concise but genuine. Do not copy the example verbatim - create a unique response that addresses the specific points in their review while maintaining the venue's voice and style.`;

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