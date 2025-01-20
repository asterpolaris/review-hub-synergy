import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VenueMetrics } from "@/types/metrics";
import { MetricVariance } from "./MetricVariance";

interface VenueMetricsTableProps {
  venues: VenueMetrics[];
}

export const VenueMetricsTable = ({ venues }: VenueMetricsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Venue</TableHead>
          <TableHead className="text-right">Reviews</TableHead>
          <TableHead className="text-right">Current Rating</TableHead>
          <TableHead className="text-right">Response Rate</TableHead>
          <TableHead className="text-right">Bad Review Response Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {venues.map((venue) => (
          <TableRow key={venue.name}>
            <TableCell className="font-medium">{venue.name}</TableCell>
            <TableCell>
              <div className="text-right space-y-1">
                <div>{venue.totalReviews}</div>
                {venue.monthOverMonth.totalReviews !== 0 && (
                  <MetricVariance 
                    value={venue.monthOverMonth.totalReviews}
                    absoluteChange={venue.totalReviews - (venue.previousPeriodMetrics?.totalReviews || 0)}
                  />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-right space-y-1">
                <div>{venue.currentRating > 0 ? venue.currentRating.toFixed(2) : '-'}</div>
                {venue.monthOverMonth.averageRating !== 0 && (
                  <MetricVariance 
                    value={venue.monthOverMonth.averageRating}
                    absoluteChange={Number((venue.currentRating - (venue.previousPeriodMetrics?.averageRating || 0)).toFixed(2))}
                  />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-right space-y-1">
                <div>{Math.round(venue.responseRate)}%</div>
                {venue.monthOverMonth.responseRate !== 0 && (
                  <MetricVariance 
                    value={venue.monthOverMonth.responseRate}
                    absoluteChange={Math.round(venue.responseRate - (venue.previousPeriodMetrics?.responseRate || 0))}
                  />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-right space-y-1">
                <div>{Math.round(venue.badReviewResponseRate)}%</div>
                {venue.monthOverMonth.badReviewResponseRate !== 0 && (
                  <MetricVariance 
                    value={venue.monthOverMonth.badReviewResponseRate}
                    absoluteChange={Math.round(venue.badReviewResponseRate - (venue.previousPeriodMetrics?.badReviewResponseRate || 0))}
                  />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};