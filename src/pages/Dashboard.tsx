import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewMetrics } from "@/hooks/useReviewMetrics";
import { ArrowDownIcon, ArrowUpIcon, RefreshCwIcon, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

const MetricVariance = ({ value, absoluteChange }: { value: number, absoluteChange: number }) => {
  const isPositive = value > 0;
  return (
    <div className={cn(
      "text-xs flex items-center gap-1",
      isPositive ? "text-green-600" : "text-red-600"
    )}>
      {isPositive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
      <span>{Math.abs(value).toFixed(1)}% ({absoluteChange > 0 ? '+' : ''}{absoluteChange})</span>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const { data: metrics, isLoading: isMetricsLoading, refetch } = useReviewMetrics(30);

  useEffect(() => {
    if (!isLoading && !session) {
      console.log("No session found, redirecting to login");
      navigate("/");
    }
  }, [session, isLoading, navigate]);

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
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metrics?.totalReviews || 0}</p>
              {metrics?.monthOverMonth.totalReviews !== 0 && (
                <MetricVariance 
                  value={metrics?.monthOverMonth.totalReviews || 0} 
                  absoluteChange={metrics?.totalReviews - (metrics?.previousPeriodMetrics?.totalReviews || 0) || 0}
                />
              )}
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {metrics?.averageRating ? metrics.averageRating.toFixed(1) : "-"}
              </p>
              {metrics?.monthOverMonth.averageRating !== 0 && (
                <MetricVariance 
                  value={metrics?.monthOverMonth.averageRating || 0}
                  absoluteChange={Number((metrics?.averageRating - (metrics?.previousPeriodMetrics?.averageRating || 0)).toFixed(1)) || 0}
                />
              )}
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {metrics?.responseRate ? `${Math.round(metrics.responseRate)}%` : "0%"}
              </p>
              {metrics?.monthOverMonth.responseRate !== 0 && (
                <MetricVariance 
                  value={metrics?.monthOverMonth.responseRate || 0}
                  absoluteChange={Math.round(metrics?.responseRate - (metrics?.previousPeriodMetrics?.responseRate || 0)) || 0}
                />
              )}
            </CardContent>
          </Card>
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Bad Review Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {metrics?.badReviewResponseRate ? `${Math.round(metrics.badReviewResponseRate)}%` : "0%"}
              </p>
              {metrics?.monthOverMonth.badReviewResponseRate !== 0 && (
                <MetricVariance 
                  value={metrics?.monthOverMonth.badReviewResponseRate || 0}
                  absoluteChange={Math.round(metrics?.badReviewResponseRate - (metrics?.previousPeriodMetrics?.badReviewResponseRate || 0)) || 0}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Metrics by Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                  <TableHead className="text-right">Avg. Rating</TableHead>
                  <TableHead className="text-right">Response Rate</TableHead>
                  <TableHead className="text-right">Bad Review Response Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.venueMetrics?.map((venue) => (
                  <TableRow key={venue.name}>
                    <TableCell className="font-medium">{venue.name}</TableCell>
                    <TableCell className="text-right">
                      {venue.totalReviews}
                      {venue.monthOverMonth.totalReviews !== 0 && (
                        <MetricVariance 
                          value={venue.monthOverMonth.totalReviews}
                          absoluteChange={venue.totalReviews - (venue.previousPeriodMetrics?.totalReviews || 0)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {venue.averageRating.toFixed(1)}
                      {venue.monthOverMonth.averageRating !== 0 && (
                        <MetricVariance 
                          value={venue.monthOverMonth.averageRating}
                          absoluteChange={Number((venue.averageRating - (venue.previousPeriodMetrics?.averageRating || 0)).toFixed(1))}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(venue.responseRate)}%
                      {venue.monthOverMonth.responseRate !== 0 && (
                        <MetricVariance 
                          value={venue.monthOverMonth.responseRate}
                          absoluteChange={Math.round(venue.responseRate - (venue.previousPeriodMetrics?.responseRate || 0))}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(venue.badReviewResponseRate)}%
                      {venue.monthOverMonth.badReviewResponseRate !== 0 && (
                        <MetricVariance 
                          value={venue.monthOverMonth.badReviewResponseRate}
                          absoluteChange={Math.round(venue.badReviewResponseRate - (venue.previousPeriodMetrics?.badReviewResponseRate || 0))}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;