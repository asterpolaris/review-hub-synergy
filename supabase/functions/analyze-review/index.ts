
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

    const { review } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        system: `You are an expert at analyzing customer reviews. Your task is to:
1. Determine the sentiment of the review (positive, neutral, or negative)
2. Provide a brief, one-sentence summary of the key points
Be concise and professional in your analysis.`,
        messages: [{
          role: 'user',
          content: `Analyze this review:
Rating: ${review.rating}
Review: "${review.comment}"

Provide the sentiment and a brief summary.`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const claudeResponse = await response.json();
    const analysisText = claudeResponse.content[0].text;

    // Extract sentiment and summary from Claude's response
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
