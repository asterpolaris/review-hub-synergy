import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const { reviews } = await req.json();

    // Group reviews by venue
    const reviewsByVenue = reviews.reduce((acc: any, review: any) => {
      if (!acc[review.venueName]) {
        acc[review.venueName] = [];
      }
      acc[review.venueName].push(review);
      return acc;
    }, {});

    // Analyze each venue's reviews
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
        system: `You are an expert at analyzing customer reviews. Your task is to analyze groups of reviews for different venues and provide a clear, concise summary that includes:
1. Overall sentiment breakdown (positive vs negative)
2. Most common themes or patterns in both positive and negative reviews
3. Standout issues or praise that appear frequently
Be professional and factual in your analysis.`,
        messages: [{
          role: 'user',
          content: `Analyze these reviews grouped by venue:
${Object.entries(reviewsByVenue).map(([venue, reviews]: [string, any[]]) => `
${venue}:
${reviews.map((r: any) => `- ${r.rating} stars: "${r.comment}"`).join('\n')}
`).join('\n')}

Provide a summary for each venue highlighting the sentiment distribution and most common themes.`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const claudeResponse = await response.json();
    const analysis = claudeResponse.content[0].text;

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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