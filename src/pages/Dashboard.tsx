
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewMetrics } from "@/hooks/useReviewMetrics";
import { RefreshCwIcon, Loader2, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VenueMetricsTable } from "@/components/dashboard/VenueMetricsTable";
import { DatePeriod } from "@/types/metrics";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { session, isLoading, googleAuthToken } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<DatePeriod>('last-month');
  
  const { data: metrics, isLoading: isMetricsLoading, refetch } = useReviewMetrics(period);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["reviews"] });
    await refetch();
  };

  if (!googleAuthToken) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center mb-2">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Connect Google Business Profile</h2>
          <p className="text-muted-foreground text-center max-w-md">
            To view your business metrics, you need to connect your Google Business Profile account.
          </p>
          <Button 
            onClick={() => navigate("/businesses")}
            className="rounded-full px-8 py-6 text-lg font-medium"
          >
            Connect Google Account
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading || isMetricsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    return null;
  }

  const rawName = session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h2 className="text-xl font-medium text-muted-foreground">
            {getGreeting()}, {firstName}
          </h2>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Follow Your Favorites</h1>
            <div className="flex gap-2">
              <Select value={period} onValueChange={(value: DatePeriod) => setPeriod(value)}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10"
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-base">
            Keep up with stats, scores, and more for every business.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Reviews"
            value={metrics?.totalReviews || 0}
            variance={metrics?.monthOverMonth.totalReviews || 0}
            absoluteChange={metrics?.totalReviews - (metrics?.previousPeriodMetrics?.totalReviews || 0) || 0}
          />
          <MetricCard
            title="Average Rating"
            value={metrics?.averageRating ? metrics.averageRating.toFixed(1) : "-"}
            variance={metrics?.monthOverMonth.averageRating || 0}
            absoluteChange={Number((metrics?.averageRating - (metrics?.previousPeriodMetrics?.averageRating || 0)).toFixed(1)) || 0}
          />
          <MetricCard
            title="Response Rate"
            value={`${Math.round(metrics?.responseRate || 0)}%`}
            variance={metrics?.monthOverMonth.responseRate || 0}
            absoluteChange={Math.round(metrics?.responseRate - (metrics?.previousPeriodMetrics?.responseRate || 0)) || 0}
          />
          <MetricCard
            title="Bad Review Response Rate"
            value={`${Math.round(metrics?.badReviewResponseRate || 0)}%`}
            variance={metrics?.monthOverMonth.badReviewResponseRate || 0}
            absoluteChange={Math.round(metrics?.badReviewResponseRate - (metrics?.previousPeriodMetrics?.badReviewResponseRate || 0)) || 0}
          />
        </div>

        <Button className="mx-auto flex items-center justify-center rounded-full px-8 py-6 text-lg font-medium">
          <Star className="mr-2 h-5 w-5" />
          Follow Businesses
        </Button>

        <Card className="rounded-2xl shadow-lg border-accent/20 overflow-hidden">
          <CardHeader className="bg-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Metrics by Venue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <VenueMetricsTable venues={metrics?.venueMetrics || []} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
