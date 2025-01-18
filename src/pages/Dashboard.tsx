import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewMetrics } from "@/hooks/useReviewMetrics";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { data: metrics, isLoading: isMetricsLoading } = useReviewMetrics();

  useEffect(() => {
    if (!isLoading && !session) {
      console.log("No session found, redirecting to login");
      navigate("/");
    }
  }, [session, isLoading, navigate]);

  if (isLoading || isMetricsLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
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
      </div>
    </AppLayout>
  );
};

export default Dashboard;