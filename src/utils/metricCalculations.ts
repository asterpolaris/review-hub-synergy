import { Review } from "@/types/review";
import { VenueMetrics, PeriodMetrics } from "@/types/metrics";
import { 
  filterReviewsByDate, 
  calculateResponseRate, 
  calculateBadReviewResponseRate, 
  calculateAverageRating 
} from "./reviewUtils";

export const calculatePeriodMetrics = (reviews: Review[]): PeriodMetrics => {
  return {
    totalReviews: reviews.length,
    averageRating: calculateAverageRating(reviews),
    responseRate: calculateResponseRate(reviews),
    badReviewResponseRate: calculateBadReviewResponseRate(reviews)
  };
};

export const calculateMetricVariance = (current: PeriodMetrics, previous: PeriodMetrics) => {
  const calculateVariance = (current: number, previous: number) => {
    return previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
  };

  return {
    totalReviews: calculateVariance(current.totalReviews, previous.totalReviews),
    averageRating: calculateVariance(current.averageRating, previous.averageRating),
    responseRate: calculateVariance(current.responseRate, previous.responseRate),
    badReviewResponseRate: calculateVariance(current.badReviewResponseRate, previous.badReviewResponseRate)
  };
};

export const calculateVenueMetrics = (reviews: Review[], daysAgo: number): VenueMetrics[] => {
  const now = new Date();
  const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  const previousStartDate = new Date(startDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

  const venueReviews = reviews.reduce((acc, review) => {
    if (!acc[review.venueName]) {
      acc[review.venueName] = [];
    }
    acc[review.venueName].push(review);
    return acc;
  }, {} as { [key: string]: Review[] });

  return Object.entries(venueReviews).map(([venueName, reviews]) => {
    const periodReviews = filterReviewsByDate(reviews, startDate);
    const previousPeriodReviews = filterReviewsByDate(
      reviews.filter(review => new Date(review.createTime) < startDate.getTime()),
      previousStartDate
    );

    const currentMetrics = calculatePeriodMetrics(periodReviews);
    const previousMetrics = calculatePeriodMetrics(previousPeriodReviews);
    const monthOverMonth = calculateMetricVariance(currentMetrics, previousMetrics);

    return {
      name: venueName,
      ...currentMetrics,
      monthOverMonth,
      previousPeriodMetrics: previousMetrics
    };
  });
};