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
5. One or two specific recommendations for improvement

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
    const { businessId, year, month, reviews } = await req.json();

    // If direct reviews analysis is provided, use it instead of fetching from the database
    if (reviews && Array.isArray(reviews) && reviews.length > 0) {
      console.log(`Analyzing ${reviews.length} reviews provided directly in the request`);
      const analysis = await callClaude(reviews);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          analysis 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Otherwise, use businessId, year, month to fetch and analyze reviews
    if (!businessId) {
      throw new Error('Business ID is required when reviews are not provided directly');
    }

    // Define current date for default values
    const now = new Date();
    const currentYear = year || now.getFullYear();
    const currentMonth = month || now.getMonth() + 1; // JavaScript months are 0-based
    
    // Calculate previous month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Create month string in YYYY-MM format for database query
    const monthString = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    console.log(`Processing monthly insights for business ${businessId} for month ${monthString}`);

    // Trigger the generation of basic statistics in the database
    const { data: insightId, error: insightError } = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/trigger_monthly_insights_generation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        },
        body: JSON.stringify({
          p_business_id: businessId,
          p_year: prevYear,
          p_month: prevMonth
        })
      }
    ).then(res => res.json());

    if (insightError) {
      throw new Error(`Error generating insights: ${insightError.message}`);
    }

    console.log(`Successfully generated base insights with ID ${insightId}`);

    // Get the month's reviews for this business
    const startDate = new Date(prevYear, prevMonth - 1, 1);
    const endDate = new Date(prevYear, prevMonth, 0);
    
    const { data: reviews, error: reviewsError } = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/reviews?business_id=eq.${businessId}&create_time=gte.${startDate.toISOString()}&create_time=lte.${endDate.toISOString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        }
      }
    ).then(res => res.json());

    if (reviewsError) {
      throw new Error(`Error fetching reviews: ${reviewsError.message}`);
    }

    console.log(`Found ${reviews.length} reviews for analysis`);

    if (!reviews || reviews.length === 0) {
      console.log('No reviews to analyze, skipping AI analysis');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No reviews found for this month, insights created with empty analysis',
          insightId 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // First, get the business details for the venue name
    const { data: business, error: businessError } = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/businesses?id=eq.${businessId}&select=*`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        }
      }
    ).then(res => res.json());

    if (businessError || !business || business.length === 0) {
      throw new Error('Could not find business details');
    }

    // Format reviews for AI analysis
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment || "",
      createTime: review.create_time,
      venueName: business[0].name
    }));

    // Call Claude for analysis
    console.log('Calling Claude for review analysis');
    const analysis = await callClaude(formattedReviews);
    console.log('Received analysis from Claude');

    // Update the venue_monthly_insights table with the analysis
    const { error: updateError } = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/venue_monthly_insights?business_id=eq.${businessId}&month=eq.${monthString}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          analysis: analysis
        })
      }
    ).then(res => res.status === 204 ? { error: null } : res.json());

    if (updateError) {
      throw new Error(`Error updating insights with analysis: ${updateError.message}`);
    }

    console.log('Successfully updated insights with AI analysis');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Monthly insights generated and updated with analysis',
        insightId 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-reviews-by-venue:', error);
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
