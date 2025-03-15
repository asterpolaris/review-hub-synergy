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
    // Safety check - if reviews is empty or undefined, return a default message
    if (!reviews || reviews.length === 0) {
      return "No reviews available for analysis.";
    }

    // Group reviews by venue and format them concisely
    const reviewsByVenue = reviews.reduce((acc: any, review: any) => {
      // Make sure venueName exists, default to "Unknown Venue" if missing
      const venueName = review.venueName || "Unknown Venue";
      
      if (!acc[venueName]) {
        acc[venueName] = [];
      }
      
      // Only include essential information to reduce payload size
      acc[venueName].push({
        rating: review.rating || 0,
        comment: review.comment || ""
      });
      return acc;
    }, {});

    // If we end up with no reviews after filtering (e.g., all comments are empty)
    if (Object.keys(reviewsByVenue).length === 0) {
      return "No valid reviews available for analysis.";
    }

    // Prepare a shorter, more focused prompt to reduce token usage
    const prompt = `Analyze these customer reviews for a business and provide:
1. Overall sentiment summary
2. Key positive themes
3. Key negative themes or areas for improvement
4. 2-3 specific recommendations

Reviews (${reviews.length} total):
${Object.entries(reviewsByVenue).map(([venue, venueReviews]: [string, any[]]) => `
${venue}:
${(venueReviews as any[]).slice(0, 20).map((r: any) => `- ${r.rating} stars: "${r.comment.substring(0, 200)}${r.comment.length > 200 ? '...' : ''}"`).join('\n')}
${venueReviews.length > 20 ? `... and ${venueReviews.length - 20} more reviews` : ''}
`).join('\n')}

Format your analysis in markdown with headers and bullet points where appropriate.`;

    console.log(`Sending request to Claude API with ${reviews.length} reviews...`);
    
    try {
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
        if ((response.status === 529 || response.status === 429) && retryCount < MAX_RETRIES) {
          console.log(`Retry attempt ${retryCount + 1} after rate limit...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return callClaude(reviews, retryCount + 1);
        }
        
        throw new Error(`Claude API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || !data.content || !data.content[0] || !data.content[0].text) {
        throw new Error("Unexpected response format from Claude API");
      }
      
      return data.content[0].text;
    } catch (fetchError) {
      console.error("Error fetching from Claude API:", fetchError);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} after fetch error`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return callClaude(reviews, retryCount + 1);
      }
      
      // If we've exhausted retries or had another error, provide a basic analysis
      return generateBasicAnalysis(reviews);
    }
  } catch (error) {
    console.error("Error in callClaude:", error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retry attempt ${retryCount + 1} after error:`, error);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return callClaude(reviews, retryCount + 1);
    }
    
    // Return a fallback message rather than throwing
    return generateBasicAnalysis(reviews);
  }
}

function generateBasicAnalysis(reviews: any[]): string {
  try {
    // Calculate basic stats
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews;
    
    // Count ratings
    const ratingCounts = [0, 0, 0, 0, 0, 0]; // Index 0 is unused, 1-5 for stars
    reviews.forEach(review => {
      const rating = Math.floor(review.rating);
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating]++;
      }
    });
    
    // Calculate positive vs negative ratio
    const positiveReviews = ratingCounts[4] + ratingCounts[5];
    const negativeReviews = ratingCounts[1] + ratingCounts[2];
    const neutralReviews = ratingCounts[3];
    
    // Generate analysis text
    let analysis = `# Review Analysis Summary\n\n`;
    
    analysis += `## Overview\n`;
    analysis += `Total reviews analyzed: ${totalReviews}\n`;
    analysis += `Average rating: ${averageRating.toFixed(1)} stars\n\n`;
    
    analysis += `## Rating Distribution\n`;
    analysis += `- 5 stars: ${ratingCounts[5]} (${((ratingCounts[5] / totalReviews) * 100).toFixed(0)}%)\n`;
    analysis += `- 4 stars: ${ratingCounts[4]} (${((ratingCounts[4] / totalReviews) * 100).toFixed(0)}%)\n`;
    analysis += `- 3 stars: ${ratingCounts[3]} (${((ratingCounts[3] / totalReviews) * 100).toFixed(0)}%)\n`;
    analysis += `- 2 stars: ${ratingCounts[2]} (${((ratingCounts[2] / totalReviews) * 100).toFixed(0)}%)\n`;
    analysis += `- 1 star: ${ratingCounts[1]} (${((ratingCounts[1] / totalReviews) * 100).toFixed(0)}%)\n\n`;
    
    analysis += `## Sentiment Overview\n`;
    analysis += `- Positive reviews (4-5 stars): ${positiveReviews} (${((positiveReviews / totalReviews) * 100).toFixed(0)}%)\n`;
    analysis += `- Neutral reviews (3 stars): ${neutralReviews} (${((neutralReviews / totalReviews) * 100).toFixed(0)}%)\n`;
    analysis += `- Negative reviews (1-2 stars): ${negativeReviews} (${((negativeReviews / totalReviews) * 100).toFixed(0)}%)\n\n`;
    
    analysis += `## General Assessment\n`;
    if (averageRating >= 4.5) {
      analysis += `Overall customer satisfaction appears to be excellent. The high percentage of 5-star ratings suggests customers are very happy with their experience.\n\n`;
    } else if (averageRating >= 4.0) {
      analysis += `Overall customer satisfaction appears to be good. Most customers are satisfied with their experience.\n\n`;
    } else if (averageRating >= 3.0) {
      analysis += `Overall customer satisfaction appears to be average. There is room for improvement in the customer experience.\n\n`;
    } else {
      analysis += `Overall customer satisfaction appears to be below average. Significant improvements may be needed to enhance the customer experience.\n\n`;
    }
    
    analysis += `## Recommendations\n`;
    analysis += `1. ${negativeReviews > 0 ? 'Examine the negative reviews to identify specific areas for improvement.' : 'Continue maintaining the high quality of service.'}\n`;
    analysis += `2. ${neutralReviews > 0 ? 'Look for ways to convert neutral (3-star) experiences into positive ones.' : 'Focus on maintaining consistency in service quality.'}\n`;
    analysis += `3. Consider implementing a review response strategy to show engagement with customer feedback.\n\n`;
    
    analysis += `*Note: This is an automated basic analysis. Detailed AI analysis of review content was unavailable.*`;
    
    return analysis;
  } catch (err) {
    console.error("Error generating basic analysis:", err);
    return "Analysis could not be generated due to technical issues. Please try again later.";
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Function invoked, parsing request...");
    const reqBody = await req.json().catch(err => {
      console.error("Error parsing request JSON:", err);
      throw new Error("Invalid JSON in request body");
    });
    
    const { businessId, year, month, reviews } = reqBody;
    console.log("Request parameters:", { businessId, year, month, hasReviews: !!reviews });

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
      console.error("Missing businessId in request");
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

    try {
      // Trigger the generation of basic statistics in the database
      console.log("Calling trigger_monthly_insights_generation function...");
      
      const insightResponse = await fetch(
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
      );

      if (!insightResponse.ok) {
        throw new Error(`Error from insights function: ${insightResponse.status} ${await insightResponse.text()}`);
      }

      const { data: insightId, error: insightError } = await insightResponse.json();
      
      if (insightError) {
        throw new Error(`Error generating insights: ${insightError.message}`);
      }

      console.log(`Successfully generated base insights with ID ${insightId}`);
    } catch (error) {
      console.error("Error generating base insights:", error);
      // Continue execution - we'll still try to get and analyze reviews
    }

    // Get the month's reviews for this business
    const startDate = new Date(prevYear, prevMonth - 1, 1);
    const endDate = new Date(prevYear, prevMonth, 0);
    
    console.log(`Fetching reviews from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    let reviews = [];
    try {
      const reviewsResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/reviews?business_id=eq.${businessId}&create_time=gte.${startDate.toISOString()}&create_time=lte.${endDate.toISOString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          }
        }
      );

      if (!reviewsResponse.ok) {
        throw new Error(`Error fetching reviews: ${reviewsResponse.status} ${await reviewsResponse.text()}`);
      }

      reviews = await reviewsResponse.json();
      console.log(`Found ${reviews ? reviews.length : 0} reviews for analysis`);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Default to empty array if there's an error
      reviews = [];
    }

    if (!reviews || reviews.length === 0) {
      console.log('No reviews to analyze, creating empty analysis');
      
      // Update the venue_monthly_insights table with an empty analysis
      try {
        await fetch(
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
              analysis: 'No reviews found for this month.'
            })
          }
        );
      } catch (error) {
        console.error("Error updating insights with empty analysis:", error);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No reviews found for this month, insights created with empty analysis'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Get the business details for the venue name
    let businessName = "Unknown Venue";
    try {
      const businessResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/rest/v1/businesses?id=eq.${businessId}&select=*`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          }
        }
      );

      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        if (businessData && businessData.length > 0) {
          businessName = businessData[0].name || "Unknown Venue";
        }
      }
    } catch (error) {
      console.error("Error fetching business details:", error);
      // Continue with default business name
    }

    // Format reviews for AI analysis
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating || 0,
      comment: review.comment || "",
      createTime: review.create_time,
      venueName: businessName
    }));

    // Call Claude for analysis
    console.log('Calling Claude for review analysis');
    let analysis = "";
    try {
      analysis = await callClaude(formattedReviews);
      console.log('Received analysis from Claude');
    } catch (error) {
      console.error("Error getting analysis from Claude:", error);
      analysis = "Analysis could not be completed due to technical issues. Please try again later.";
    }

    // Update the venue_monthly_insights table with the analysis
    try {
      console.log("Updating insights table with analysis...");
      const updateResponse = await fetch(
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
      );

      if (!updateResponse.ok) {
        throw new Error(`Error updating insights: ${updateResponse.status} ${await updateResponse.text()}`);
      }
    } catch (error) {
      console.error("Error updating insights with analysis:", error);
      // Continue execution to return the analysis to the client
    }

    console.log('Successfully updated insights with AI analysis');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Monthly insights generated and updated with analysis',
        analysis
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
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : null 
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
