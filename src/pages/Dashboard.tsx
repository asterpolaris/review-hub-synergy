import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewMetrics } from "@/hooks/useReviewMetrics";
import { RefreshCwIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { VenueMetricsTable } from "@/components/dashboard/VenueMetricsTable";

const Dashboard = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const { data: metrics, isLoading: isMetricsLoading, refetch } = useReviewMetrics(30);

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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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