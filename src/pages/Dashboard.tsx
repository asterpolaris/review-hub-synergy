import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewMetrics } from "@/hooks/useReviewMetrics";
import { ArrowDownIcon, ArrowUpIcon, RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";

const MetricVariance = ({ value }: { value: number }) => {
  const isPositive = value > 0;
  return (
    <div className={cn(
      "text-xs flex items-center gap-1",
      isPositive ? "text-green-600" : "text-red-600"
    )}>
      {isPositive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
      <span>{Math.abs(value).toFixed(1)}% MoM</span>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: metrics, isLoading: isMetricsLoading, refetch } = useReviewMetrics();

  useEffect(() => {
    if (!isLoading && !session) {
      console.log("No session found, redirecting to login");
      navigate("/");
    }
  }, [session, isLoading, navigate]);

  const handleRefresh = async () => {
    // Invalidate and refetch reviews data first
    await queryClient.invalidateQueries({ queryKey: ["reviews"] });
    // Then refetch metrics
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Total Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metrics?.totalReviews || 0}</p>
              {metrics?.monthOverMonth.totalReviews !== 0 && (
                <MetricVariance value={metrics?.monthOverMonth.totalReviews || 0} />
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
                <MetricVariance value={metrics?.monthOverMonth.averageRating || 0} />
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
                <MetricVariance value={metrics?.monthOverMonth.responseRate || 0} />
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.venueMetrics?.map((venue) => (
                  <TableRow key={venue.name}>
                    <TableCell className="font-medium">{venue.name}</TableCell>
                    <TableCell className="text-right">
                      {venue.totalReviews}
                      {venue.monthOverMonth.totalReviews !== 0 && (
                        <MetricVariance value={venue.monthOverMonth.totalReviews} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {venue.averageRating.toFixed(1)}
                      {venue.monthOverMonth.averageRating !== 0 && (
                        <MetricVariance value={venue.monthOverMonth.averageRating} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(venue.responseRate)}%
                      {venue.monthOverMonth.responseRate !== 0 && (
                        <MetricVariance value={venue.monthOverMonth.responseRate} />
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