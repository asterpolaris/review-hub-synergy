import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const venueDescriptions = {
  "YOKO Luna": {
    long: "A high-end restaurant and nightlife venue that merges fine dining with entertainment. Housed within dreamlike environments, Yoko Luna merges fine dining with nightlife. Features neo-tokyo inspired nightclub, international DJs, performance dancers, aerialists, and specialty acts. Located at 1234 De La Montagne with eight distinct areas.",
    short: "Canada's premier destination for dining and nightlife. Nikkei cuisine and Neo-Tokyo inspired nightlife in downtown Montreal.",
    style: "Elegant and professional, with a focus on creating memorable dining experiences. Responses should be warm and inviting while maintaining sophistication.",
    contactEmail: "concierge@yokoluna.com",
    examples: {
      positive: "Hi Jakub Pistol,\n\nThank you so much for your wonderful review! We're delighted to hear that you enjoyed your time with us at Yoko Luna. It means a lot to our team to know that we made your visit special.\n\nWe look forward to welcoming you back soon for another memorable experience.\n\nWarm regards,\nThe Yoko Luna Team",
      negative: "Hi Shaina\n\nThank you for sharing your feedback with us. We're sorry to hear that your experience at Yoko Luna didn't meet your expectations. Your comments about your recent visit are important to us, and we'll be discussing them with our team to make improvements.\n\nWe would appreciate the opportunity to make things right. Please feel free to reach out to us directly at concierge@yokoluna.com so we can address your concerns personally.\n\nSincerely,\nYoko Luna Management"
    }
  },
  "Bord'Elle Boutique Bar & Eatery": {
    long: "An upscale restaurant and bar celebrating the 1920s era with glitz and glamour in Old Montréal. Combines European boutique hotel sophistication with high-energy nightlife, featuring creative cuisine, world-class burlesque, aerial performances, and flapper girls.",
    short: "1920's inspired boutique bar & restaurant with international cuisine and live performances in Old Montreal.",
    style: "Enthusiastic and personal, with a touch of vintage charm. Responses should convey excitement about the dining experience while maintaining professionalism.",
    contactEmail: "guestrelations@bordelle.ca",
    examples: {
      positive: "Wow Kris! Thank you so much for taking the time to write this amazing review! We are so humbled and honoured. We hope to see you back again and again!!",
      negative: "Hello Julie,\n\nThank you for dining with us and sharing your feedback. We are sorry to hear about your disappointing evening. Our single purpose is to provide our clients with the most unforgettable dining experience, and it seems we fell short here.\n\nWe take this very serious, and as such, would you be open to discuss it? If so, please send us a short email detailing your evening using the following address: guestrelations@bordelle.ca.\n\nOur hope is that we can take your notes, suggestions and improve our service and provide you with a new opportunity to experience Bord'Elle as it was meant to be! We appreciate the fact that you chose to celebrate an evening with us and we look forward to hearing from you.\n\nThe Bord'Elle Team"
    }
  },
  "MUZIQUE": {
    long: "A premier nightclub and lounge since 2009 featuring two distinct rooms with local and international DJs playing house and hip hop, complemented by a sophisticated bar service. Includes a rooftop terrace bar for warmer nights offering craft cocktails and a curated wine list.",
    short: "Montreal's most famous club & rooftop lounge since 2009.",
    style: "Direct and professional, focusing on the nightlife and bar experience. Responses should be concise while showing appreciation for feedback.",
    contactEmail: "info@muziquemontreal.com",
    examples: {
      positive: "We appreciate you taking the time to leave your feedback. It was a pleasure hosting you, and we look forward to welcoming you back again soon!",
      negative: "Thank you for sharing your feedback. We're truly sorry to hear that your experience did not meet your expectations. Our goal is always to provide a memorable night out for all our guests.\n\nWe would love the opportunity to make things right and learn more about what happened so we can address your concerns and improve. Please feel free to reach out to us directly at info@muziquemontreal.com and a member of our team will be happy to assist you. We value your input and hope to welcome you back for a much better experience in the future."
    }
  },
  "HANG Bar": {
    long: "An upscale Vietnamese restaurant and cocktail bar offering a unique culinary and mixology experience. Features DIY mixology platters, specialty cocktails with Vietnamese spices, and a vibrant atmosphere that transports guests to Vietnam through both food and ambiance.",
    short: "Haute-Viet dining and mixology bar in Old Montreal, blending refined cuisine with sophisticated nightlife.",
    style: "Personal and warm, with attention to culinary detail. Responses should reflect the intimate nature of the dining experience while maintaining professionalism.",
    contactEmail: "karina@jegantic.com",
    examples: {
      positive: "Hi Susan, thank you for your beautiful review. It was a pleasure having you.\n\n~ The Hang team",
      negative: "Hi Cheryl,\n\nThank you for taking the time to share your thoughts. We're truly sorry to hear that your dining experience didn't meet your expectations, as our goal is always to provide an unforgettable culinary journey for our guests.\n\nWe value your feedback immensely and would love the opportunity to discuss your experience further. If you're open to it, please feel free to send us an email at karina@jegantic.com with a brief description of your evening, along with your name and phone number.\n\nYour insights are invaluable in helping us improve, and we'd love the chance to welcome you back for the experience you deserve. Thank you again for choosing to spend an evening with us—we look forward to hearing from you!\n\nWarm regards,\nHang Bar Team"
    }
  },
  "THE FARSIDES": {
    long: "A unique fusion restaurant and bar combining Thai-American cuisine with hip hop culture in Old Montreal. Features contemporary street art, creative cocktails, nightly DJs, and an innovative dining menu that bridges cultural flavors in a vibrant atmosphere.",
    short: "Thai-American restaurant and tiki bar with 80s/90s hip-hop vibes in Old Montreal.",
    style: "Casual yet professional, with a focus on community and dining experience. Responses should feel authentic and personal while addressing concerns thoroughly.",
    contactEmail: "info@thefarsides.com",
    examples: {
      positive: "Thank you so much Daniel, for the visit and the review. We will share your message with our team. We hope to see you again soon.",
      negative: "Thank you for sharing your feedback with us. We are truly sorry to hear that your dining experience fell short of the high standards we strive to uphold. It is always our goal to provide an exceptional experience for all of our guests, and we deeply regret that this wasn't the case during your visit.\n\nPlease accept our sincerest apologies for the inconvenience and frustration your group encountered. We recognize that no guest should ever feel overlooked, regardless of how busy the evening may be.\n\nWe would greatly appreciate the opportunity to make things right. Kindly reach out to us directly at info@thefarsides.com at your earliest convenience, so we can learn more about your experience and ensure your next visit exceeds expectations.\n\nYour feedback is invaluable in helping us improve, and we hope to welcome you back soon.\n\nWarm regards,\nThe Farsides Family"
    }
  },
  "THE FARSIDES BROSSARD": {
    long: "A vibrant Thai-American restaurant and cocktail bar inspired by hip hop & pop culture from the 80's & 90's. Features street art, graffiti-inspired decor, nightly DJs, and an innovative fusion menu at Solar Uniquartier, bringing the same energy as the original location.",
    short: "Thai-American restaurant and tiki bar with 80s/90s hip-hop inspiration in Brossard.",
    style: "Casual yet professional, with a focus on community and dining experience. Responses should feel authentic and personal while addressing concerns thoroughly.",
    contactEmail: "info@thefarsides.com",
    examples: {
      positive: "Thank you so much Daniel, for the visit and the review. We will share your message with our team. We hope to see you again soon.",
      negative: "Thank you for sharing your feedback with us. We are truly sorry to hear that your dining experience fell short of the high standards we strive to uphold. It is always our goal to provide an exceptional experience for all of our guests, and we deeply regret that this wasn't the case during your visit.\n\nPlease accept our sincerest apologies for the inconvenience and frustration your group encountered. We recognize that no guest should ever feel overlooked, regardless of how busy the evening may be.\n\nWe would greatly appreciate the opportunity to make things right. Kindly reach out to us directly at info@thefarsides.com at your earliest convenience, so we can learn more about your experience and ensure your next visit exceeds expectations.\n\nYour feedback is invaluable in helping us improve, and we hope to welcome you back soon.\n\nWarm regards,\nThe Farsides Family"
    }
  }
};

const determineResponseLanguage = (reviewText: string): 'english' | 'french' => {
  // Common words/patterns for language detection
  const frenchPatterns = /[àâçéèêëîïôûùüÿæœ]|(\b(je|tu|il|nous|vous|ils|le|la|les|un|une|des|est|sont|avoir|être|fait|dans|pour|avec|bonjour|merci)\b)/i;
  const englishPatterns = /\b(the|be|to|of|and|a|in|that|have|it|for|not|on|with|he|she|they|at|by|this|we|you|do|but|from|or|which|one|would|all|will|there|say|who|make|when|can|more|if|no|man|out|other|what|time|up|go|about|than|into|could|state|only|new|year|some|take|come|these|know|see|use|get|like|then|first|any|work|now|may|such|give|over|think)\b/i;
  
  // Romance language patterns (for non-English/French detection)
  const romancePatterns = /[áéíóúñ]|\b(el|la|los|las|un|una|es|son|estar|hacer|por|con|como|pero|para|este|ese|muy|bien|gracias|ciao|bella|sono|questo|quella|anche|pero|assim|isso|aqui|muito|bem|obrigado)\b/i;

  // Check for direct French or English first
  if (frenchPatterns.test(reviewText)) return 'french';
  if (englishPatterns.test(reviewText)) return 'english';

  // For other languages, default to French if it seems like a Romance language
  return romancePatterns.test(reviewText) ? 'french' : 'english';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting generate-review-reply function');

    if (!anthropicApiKey) {
      console.error('Missing ANTHROPIC_API_KEY');
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const { review } = await req.json();
    
    console.log('Processing review:', {
      venueName: review.venueName,
      rating: review.rating,
      authorName: review.authorName
    });
    
    const normalizedVenueName = review.venueName.toUpperCase();
    const venueKey = Object.keys(venueDescriptions).find(key => 
      key.toUpperCase() === normalizedVenueName
    );
    
    if (!venueKey) {
      console.error(`Venue ${review.venueName} (normalized: ${normalizedVenueName}) not found in templates`);
      console.log('Available venues:', Object.keys(venueDescriptions));
      throw new Error(`Venue ${review.venueName} not found in templates. Available venues: ${Object.keys(venueDescriptions).join(', ')}`);
    }

    const venueInfo = venueDescriptions[venueKey as keyof typeof venueDescriptions];
    const isNegative = review.rating <= 3;
    const responseLanguage = determineResponseLanguage(review.comment);

    // Select model based on review rating
    const model = isNegative ? 'claude-3-sonnet-20240307' : 'claude-3-haiku-20240307';

    console.log('Generating response with parameters:', {
      venue: venueKey,
      isNegative,
      responseLanguage,
      model
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        system: `You are a professional customer service representative for ${venueKey}, a hospitality venue. 

Venue description: ${venueInfo.long}

Writing style: ${venueInfo.style}

Language instructions: Respond in ${responseLanguage}. This is crucial - do not deviate from this language choice regardless of the original review's language.

Important guidelines:
1. Always maintain a polite and professional tone
2. For negative reviews (3 stars or less), always include the venue's contact email (${venueInfo.contactEmail}) and encourage the reviewer to reach out directly
3. For positive reviews, keep responses concise (maximum 2 sentences)
4. Ensure your response matches the sophistication level of the venue

Here is an example of how we've responded to ${isNegative ? 'negative' : 'positive'} reviews in ${responseLanguage} (use this as inspiration for tone and style, but do not copy verbatim):

${isNegative ? venueInfo.examples.negative : venueInfo.examples.positive}`,
        messages: [{
          role: 'user',
          content: `You are responding to a ${review.rating}-star review from ${review.authorName}. 
Their review: "${review.comment}"

Write a unique response that:
${isNegative ? `
- Shows genuine concern and apologizes for their experience
- Acknowledges specific issues mentioned in their review
- Includes the venue's contact email and encourages direct communication
- Maintains professionalism while showing empathy` 
: `
- Shows genuine appreciation in a concise way
- Keep the response to maximum 2 sentences
- Be warm but brief
- Maintain the venue's unique voice`}

${isNegative ? 
  'Keep the response professional and thorough to address their concerns.' : 
  'Keep the response very concise but genuine. Do not write more than 2 sentences.'}

Remember to respond in ${responseLanguage} only.`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const claudeResponse = await response.json();
    console.log('Claude API response:', claudeResponse);

    if (!claudeResponse.content || !claudeResponse.content[0] || !claudeResponse.content[0].text) {
      console.error('Unexpected Claude API response format:', claudeResponse);
      throw new Error('Invalid response format from Claude API');
    }

    const generatedReply = claudeResponse.content[0].text;
    console.log('Successfully generated response');

    return new Response(
      JSON.stringify({ reply: generatedReply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-review-reply:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});