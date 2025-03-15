
import { Loader2, RefreshCw, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useVenueInsights } from "@/hooks/useVenueInsights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface VenueInsightsProps {
  businessId: string;
}

export const VenueInsights = ({ businessId }: VenueInsightsProps) => {
  const { data: insights, isLoading, refetch, isError, error } = useVenueInsights(businessId);
  const [syncingReviews, setSyncingReviews] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
  const [isGeneratingLocalAnalysis, setIsGeneratingLocalAnalysis] = useState(false);
  const { toast } = useToast();

  const handleSyncReviews = async () => {
    try {
      setSyncingReviews(true);
      
      const { error: syncError } = await supabase.rpc('sync_reviews_for_business', {
        business_id: businessId
      });
      
      if (syncError) {
        throw new Error(syncError.message);
      }
      
      toast({
        title: "Success",
        description: "Reviews synced successfully. Refreshing insights...",
      });
      
      // No need to call Edge Function directly - just refresh data
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      console.error("Error syncing reviews:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync reviews",
        variant: "destructive",
      });
    } finally {
      setSyncingReviews(false);
    }
  };

  const copyAnalysisToClipboard = () => {
    if (insights?.analysis) {
      navigator.clipboard.writeText(insights.analysis);
      toast({
        title: "Copied",
        description: "Analysis copied to clipboard",
      });
    }
  };

  const generateLocalAnalysis = () => {
    if (!insights || !insights.reviewCount) return "No reviews available to analyze.";
    
    setIsGeneratingLocalAnalysis(true);
    try {
      const rating = insights.averageRating || 0;
      const reviewCount = insights.reviewCount || 0;
      const responseRate = insights.responseRate || 0;
      
      let analysis = `# ${insights.businessName || 'Business'} Review Analysis\n\n`;
      
      analysis += `## Rating Summary\n`;
      analysis += `Based on ${reviewCount} reviews, the average rating is ${rating.toFixed(1)} out of 5 stars.\n\n`;
      
      analysis += `## Response Performance\n`;
      analysis += `The business has responded to ${responseRate.toFixed(0)}% of customer reviews.\n\n`;
      
      analysis += `## General Assessment\n`;
      if (rating >= 4.5) {
        analysis += `Overall customer satisfaction appears to be excellent. The high average rating suggests customers are very happy with their experience.\n\n`;
      } else if (rating >= 4.0) {
        analysis += `Overall customer satisfaction appears to be good. Most customers are satisfied with their experience.\n\n`;
      } else if (rating >= 3.0) {
        analysis += `Overall customer satisfaction appears to be average. There is room for improvement in the customer experience.\n\n`;
      } else {
        analysis += `Overall customer satisfaction appears to be below average. Significant improvements may be needed to enhance the customer experience.\n\n`;
      }
      
      analysis += `## Response Rate Assessment\n`;
      if (responseRate >= 80) {
        analysis += `The business is highly engaged with customer feedback, responding to most reviews.\n\n`;
      } else if (responseRate >= 50) {
        analysis += `The business shows moderate engagement with customer feedback.\n\n`;
      } else {
        analysis += `The business could improve engagement by responding to more customer reviews.\n\n`;
      }
      
      analysis += `## Recommendations\n`;
      analysis += `1. ${responseRate < 80 ? 'Increase response rate to customer reviews to show engagement.' : 'Maintain the high response rate to customer reviews.'}\n`;
      analysis += `2. ${rating < 4.5 ? 'Look for common themes in lower-rated reviews to identify improvement opportunities.' : 'Continue providing the high-quality service that customers appreciate.'}\n\n`;
      
      analysis += `*Note: This is a basic automated analysis. A more detailed AI analysis with review content examination was unavailable.*`;
      
      return analysis;
    } catch (err) {
      console.error("Error generating local analysis:", err);
      return "Unable to generate analysis at this time.";
    } finally {
      setIsGeneratingLocalAnalysis(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    // Provide a more user-friendly error card that won't crash the UI
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="my-4">
            <AlertDescription className="flex flex-col gap-4">
              <div>Failed to load venue insights. Please try again later.</div>
              <div className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Connection to analytics service failed"}
              </div>
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                className="self-start"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Safeguard against undefined insights
  if (!insights) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No insights data is available.</p>
            <Button onClick={handleSyncReviews} disabled={syncingReviews}>
              {syncingReviews ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Latest Reviews
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastMonth = new Date();
  lastMonth.setDate(1);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const monthLabel = format(lastMonth, 'MMMM yyyy');

  if (insights.reviewCount === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Insights: {monthLabel}</CardTitle>
          <CardDescription>Review analysis for {monthLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No reviews found for {monthLabel}.</p>
            <Button onClick={handleSyncReviews} disabled={syncingReviews}>
              {syncingReviews ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Latest Reviews
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if analysis is unavailable or contains error message
  const isAnalysisUnavailable = !insights.analysis || 
                               insights.analysis === "Analysis is currently unavailable. Please try again later." || 
                               insights.analysis.includes("could not be completed") ||
                               insights.analysis.includes("unavailable");
  
  // Use local fallback if AI analysis is unavailable
  const analysisContent = isAnalysisUnavailable ? generateLocalAnalysis() : insights.analysis;

  // Format the analysis for display with appropriate styling
  const formattedAnalysis = (analysisContent || "No analysis available.")
    .split('\n')
    .map((line, index) => {
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        const text = line.replace(/^#+\s*/, '');
        const className = level === 1 ? 'text-lg font-bold my-2' : 'text-md font-semibold my-1';
        return <h3 key={index} className={className}>{text}</h3>;
      }
      
      if (line.match(/^\d+\.\s/)) {
        return <li key={index} className="ml-4">{line.replace(/^\d+\.\s/, '')}</li>;
      }
      
      return (
        <p key={index} className={`${line.trim() === '' ? 'my-2' : 'my-1'}`}>
          {line}
        </p>
      );
    });

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Monthly Insights: {monthLabel}</CardTitle>
            <CardDescription>Review analysis for {monthLabel}</CardDescription>
          </div>
          <Button variant="outline" onClick={handleSyncReviews} disabled={syncingReviews}>
            {syncingReviews ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-2xl font-bold">{insights.reviewCount}</div>
            <div className="text-sm text-muted-foreground">Reviews this month</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-2xl font-bold">{insights.averageRating?.toFixed(1) || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Average rating</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-2xl font-bold">{insights.responseRate?.toFixed(0) || 0}%</div>
            <div className="text-sm text-muted-foreground">Response rate</div>
          </div>
        </div>
        
        <Collapsible 
          open={isAnalysisOpen} 
          onOpenChange={setIsAnalysisOpen}
          className="border rounded-lg p-2"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">
              {isAnalysisUnavailable ? 'Basic Analysis' : 'AI Analysis'}
              {isAnalysisUnavailable && (
                <span className="text-xs ml-2 text-amber-500">
                  (AI analysis unavailable)
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={copyAnalysisToClipboard}
                title="Copy analysis to clipboard"
                disabled={isGeneratingLocalAnalysis}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost" disabled={isGeneratingLocalAnalysis}>
                  {isAnalysisOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            <div className="bg-muted p-4 rounded-lg text-sm">
              {isGeneratingLocalAnalysis ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Generating basic analysis...</span>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert">
                  {formattedAnalysis}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
