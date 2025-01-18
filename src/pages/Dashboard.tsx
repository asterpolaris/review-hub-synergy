import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewMetrics } from "@/hooks/useReviewMetrics";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VenueMetricsTable } from "@/components/dashboard/VenueMetricsTable";
import { DatePeriod } from "@/types/metrics";

const Dashboard = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<DatePeriod>('last-30-days');
  
  const getDays = (period: DatePeriod): number => {
    switch (period) {
      case 'last-month':
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return Math.ceil((lastMonthEnd.getTime() - lastMonth.getTime()) / (1000 * 60 * 60 * 24));
      case 'last-30-days':
        return 30;
      case 'last-year':
        return 365;
      case 'lifetime':
        return 3650; // 10 years as maximum
      default:
        return 30;
    }
  };

  const { data: metrics, isLoading: isMetricsLoading, refetch } = useReviewMetrics(getDays(period));

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["reviews"] });
    await refetch();
  };

  if (isLoading || isMetricsLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
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