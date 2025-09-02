
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const { review } = await req.json();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://desk.jegantic.com',
        'X-Title': 'Desk Reviews'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'system',
          content: `You are an expert at analyzing customer reviews. Your task is to:
1. Determine the sentiment of the review (positive, neutral, or negative)
2. Provide a brief, one-sentence summary of the key points
Be concise and professional in your analysis.`
        }, {
          role: 'user',
          content: `Analyze this review:
Rating: ${review.rating} out of 5 stars
Review: "${review.comment}"

Provide the sentiment and a brief summary.`
        }],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const geminiResponse = await response.json();
    const analysisText = geminiResponse.choices[0].message.content;

    // Extract sentiment and summary from Gemini's response
    const sentimentMatch = analysisText.match(/Sentiment:\s*(.*?)(?:\.|$)/i);
    const summaryMatch = analysisText.match(/Summary:\s*(.*?)(?:\.|$)/i);

    const analysis = {
      sentiment: sentimentMatch ? sentimentMatch[1].trim() : "Unknown",
      summary: summaryMatch ? summaryMatch[1].trim() : "No summary available"
    };

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-review:', error);
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
