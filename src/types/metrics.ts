export interface MetricVariance {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  badReviewResponseRate: number;
}

export interface PeriodMetrics {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  badReviewResponseRate: number;
}

export interface VenueMetrics {
  name: string;
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  badReviewResponseRate: number;
  monthOverMonth: MetricVariance;
  previousPeriodMetrics?: PeriodMetrics;
}

export interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  badReviewResponseRate: number;
  monthOverMonth: MetricVariance;
  previousPeriodMetrics?: PeriodMetrics;
  venueMetrics: VenueMetrics[];
}