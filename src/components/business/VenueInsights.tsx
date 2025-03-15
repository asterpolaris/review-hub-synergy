
import { Loader2, RefreshCw } from "lucide-react";
import { useVenueInsights } from "@/hooks/useVenueInsights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VenueInsightsProps {
  businessId: string;
}

export const VenueInsights = ({ businessId }: VenueInsightsProps) => {
  const { data: insights, isLoading, refetch, isError, error } = useVenueInsights(businessId);
  const [syncingReviews, setSyncingReviews] = useState(false);
  const { toast } = useToast();

  const handleSyncReviews = async () => {
    try {
      setSyncingReviews(true);
      
      // First refresh Google reviews from the source
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
      
      // Now trigger the edge function to regenerate monthly insights
      const lastMonth = new Date();
      lastMonth.setDate(1);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const { error: analysisError } = await supabase.functions.invoke('analyze-reviews-by-venue', {
        body: { 
          businessId,
          year: lastMonth.getFullYear(),
          month: lastMonth.getMonth() + 1 // Edge function expects 1-based months
        }
      });
      
      if (analysisError) {
        throw new Error("Failed to analyze reviews");
      }
      
      // Wait a moment for the sync to complete on the backend
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

  if (isError || !insights) {
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
                {error instanceof Error ? error.message : "Unknown error"}
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

  // Display the month this data is for
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

  // Format the analysis by preserving line breaks for better readability
  const formattedAnalysis = (insights.analysis || "No analysis available.")
    .split('\n')
    .map((line, index) => (
      <p key={index} className={`${line.trim() === '' ? 'my-2' : 'my-1'}`}>
        {line}
      </p>
    ));

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
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h3 className="text-lg font-medium mb-2">AI Analysis</h3>
          <div className="bg-muted p-4 rounded-lg text-sm">
            {formattedAnalysis}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
