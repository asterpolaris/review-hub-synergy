import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function callClaude(reviews: any[], retryCount = 0): Promise<string> {
  try {
    // Group reviews by venue and format them concisely
    const reviewsByVenue = reviews.reduce((acc: any, review: any) => {
      if (!acc[review.venueName]) {
        acc[review.venueName] = [];
      }
      // Only include essential information to reduce payload size
      acc[review.venueName].push({
        rating: review.rating,
        comment: review.comment
      });
      return acc;
    }, {});

    const prompt = `Analyze these reviews grouped by venue. For each venue, provide:
1. Overall sentiment (positive/negative ratio)
2. Key themes in positive reviews
3. Key themes in negative reviews
4. Standout issues or praise that appear frequently

Reviews by venue:
${Object.entries(reviewsByVenue).map(([venue, reviews]: [string, any[]]) => `
${venue}:
${reviews.map((r: any) => `- ${r.rating} stars: "${r.comment}"`).join('\n')}
`).join('\n')}

Provide a clear, structured analysis for each venue.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error response:', errorText);
      
      // If overloaded and we haven't exceeded retries, try again
      if (response.status === 529 && retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} after overload...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return callClaude(reviews, retryCount + 1);
      }
      
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retry attempt ${retryCount + 1} after error:`, error);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return callClaude(reviews, retryCount + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviews } = await req.json();

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      throw new Error('No reviews provided or invalid format');
    }

    console.log(`Processing ${reviews.length} reviews...`);

    const analysis = await callClaude(reviews);

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-reviews:', error);
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