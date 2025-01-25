import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewMetrics } from "@/hooks/useReviewMetrics";
import { RefreshCwIcon, Loader2 } from "lucide-react";
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
  const [period, setPeriod] = useState<DatePeriod>('last-30-days');
  
  const { data: metrics, isLoading: isMetricsLoading, refetch } = useReviewMetrics(period);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["reviews"] });
    await refetch();
  };

  if (!googleAuthToken) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h2 className="text-2xl font-semibold">Connect Google Business Profile</h2>
          <p className="text-muted-foreground text-center max-w-md">
            To view your business metrics, you need to connect your Google Business Profile account.
          </p>
          <Button onClick={() => navigate("/businesses")}>
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

  const firstName = session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'there';
  const greeting = `${getGreeting()}, ${firstName}`;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-medium tracking-tight text-muted-foreground">
              {greeting}
            </h2>
            <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(value: DatePeriod) => setPeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Metrics by Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueMetricsTable venues={metrics?.venueMetrics || []} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;