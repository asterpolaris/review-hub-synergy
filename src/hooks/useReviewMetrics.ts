import { useQuery } from "@tanstack/react-query";
import { useReviews } from "./useReviews";
import { Review } from "@/types/review";

interface MetricVariance {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  badReviewResponseRate: number;
}

interface PeriodMetrics {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  badReviewResponseRate: number;
}

interface VenueMetrics {
  name: string;
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  badReviewResponseRate: number;
  monthOverMonth: MetricVariance;
  previousPeriodMetrics?: PeriodMetrics;
}

interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  badReviewResponseRate: number;
  monthOverMonth: MetricVariance;
  previousPeriodMetrics?: PeriodMetrics;
  venueMetrics: VenueMetrics[];
}

const convertGoogleRating = (rating: string | number): number => {
  const ratingMap: { [key: string]: number } = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5
  };
  
  if (typeof rating === 'string' && rating in ratingMap) {
    return ratingMap[rating];
  }
  return Number(rating);
};

const calculateVenueMetrics = (reviews: Review[], daysAgo: number): VenueMetrics[] => {
  const now = new Date();
  const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  const previousStartDate = new Date(startDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

  // Group reviews by venue
  const venueReviews = reviews.reduce((acc, review) => {
    if (!acc[review.venueName]) {
      acc[review.venueName] = [];
    }
    acc[review.venueName].push(review);
    return acc;
  }, {} as { [key: string]: Review[] });

  return Object.entries(venueReviews).map(([venueName, venueReviews]) => {
    // Current period reviews for this venue
    const periodReviews = venueReviews.filter(review => 
      new Date(review.createTime).getTime() >= startDate.getTime()
    );

    // Previous period reviews for this venue
    const previousPeriodReviews = venueReviews.filter(review => 
      new Date(review.createTime).getTime() >= previousStartDate.getTime() &&
      new Date(review.createTime).getTime() < startDate.getTime()
    );

    // Calculate current period metrics
    const totalReviews = periodReviews.length;
    const averageRating = totalReviews > 0
      ? periodReviews.reduce((acc, review) => acc + convertGoogleRating(review.rating), 0) / totalReviews
      : 0;
    const responseRate = totalReviews > 0
      ? (periodReviews.filter(review => review.reply).length / totalReviews) * 100
      : 0;

    // Calculate bad review response rate
    const badReviews = periodReviews.filter(review => convertGoogleRating(review.rating) <= 3);
    const badReviewResponseRate = badReviews.length > 0
      ? (badReviews.filter(review => review.reply).length / badReviews.length) * 100
      : 0;

    // Calculate previous period metrics
    const prevTotalReviews = previousPeriodReviews.length;
    const prevAverageRating = prevTotalReviews > 0
      ? previousPeriodReviews.reduce((acc, review) => acc + convertGoogleRating(review.rating), 0) / prevTotalReviews
      : 0;
    const prevResponseRate = prevTotalReviews > 0
      ? (previousPeriodReviews.filter(review => review.reply).length / prevTotalReviews) * 100
      : 0;

    // Calculate previous bad review response rate
    const prevBadReviews = previousPeriodReviews.filter(review => convertGoogleRating(review.rating) <= 3);
    const prevBadReviewResponseRate = prevBadReviews.length > 0
      ? (prevBadReviews.filter(review => review.reply).length / prevBadReviews.length) * 100
      : 0;

    // Calculate month-over-month changes
    const totalReviewsChange = prevTotalReviews > 0 
      ? ((totalReviews - prevTotalReviews) / prevTotalReviews) * 100 
      : totalReviews > 0 ? 100 : 0;

    const averageRatingChange = prevAverageRating > 0 
      ? ((averageRating - prevAverageRating) / prevAverageRating) * 100 
      : averageRating > 0 ? 100 : 0;

    const responseRateChange = prevResponseRate > 0 
      ? ((responseRate - prevResponseRate) / prevResponseRate) * 100 
      : responseRate > 0 ? 100 : 0;

    const badReviewResponseRateChange = prevBadReviewResponseRate > 0
      ? ((badReviewResponseRate - prevBadReviewResponseRate) / prevBadReviewResponseRate) * 100
      : badReviewResponseRate > 0 ? 100 : 0;

    return {
      name: venueName,
      totalReviews,
      averageRating,
      responseRate,
      badReviewResponseRate,
      monthOverMonth: {
        totalReviews: totalReviewsChange,
        averageRating: averageRatingChange,
        responseRate: responseRateChange,
        badReviewResponseRate: badReviewResponseRateChange
      },
      previousPeriodMetrics: {
        totalReviews: prevTotalReviews,
        averageRating: prevAverageRating,
        responseRate: prevResponseRate,
        badReviewResponseRate: prevBadReviewResponseRate
      }
    };
  });
};

const calculateMetrics = (reviews: Review[], daysAgo: number): ReviewMetrics => {
  const now = new Date();
  const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  
  // Filter reviews for current period
  const periodReviews = reviews.filter(review => 
    new Date(review.createTime).getTime() >= startDate.getTime()
  );

  // Filter reviews for previous period
  const previousStartDate = new Date(startDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  const previousPeriodReviews = reviews.filter(review => 
    new Date(review.createTime).getTime() >= previousStartDate.getTime() &&
    new Date(review.createTime).getTime() < startDate.getTime()
  );

  // Calculate current period metrics
  const totalReviews = periodReviews.length;
  const averageRating = totalReviews > 0
    ? periodReviews.reduce((acc, review) => acc + convertGoogleRating(review.rating), 0) / totalReviews
    : 0;
  const responseRate = totalReviews > 0
    ? (periodReviews.filter(review => review.reply).length / totalReviews) * 100
    : 0;

  // Calculate bad review response rate
  const badReviews = periodReviews.filter(review => convertGoogleRating(review.rating) <= 3);
  const badReviewResponseRate = badReviews.length > 0
    ? (badReviews.filter(review => review.reply).length / badReviews.length) * 100
    : 0;

  // Calculate previous period metrics
  const prevTotalReviews = previousPeriodReviews.length;
  const prevAverageRating = prevTotalReviews > 0
    ? previousPeriodReviews.reduce((acc, review) => acc + convertGoogleRating(review.rating), 0) / prevTotalReviews
    : 0;
  const prevResponseRate = prevTotalReviews > 0
    ? (previousPeriodReviews.filter(review => review.reply).length / prevTotalReviews) * 100
    : 0;

  // Calculate previous bad review response rate
  const prevBadReviews = previousPeriodReviews.filter(review => convertGoogleRating(review.rating) <= 3);
  const prevBadReviewResponseRate = prevBadReviews.length > 0
    ? (prevBadReviews.filter(review => review.reply).length / prevBadReviews.length) * 100
    : 0;

  // Calculate month-over-month changes
  const totalReviewsChange = prevTotalReviews > 0 
    ? ((totalReviews - prevTotalReviews) / prevTotalReviews) * 100 
    : totalReviews > 0 ? 100 : 0;

  const averageRatingChange = prevAverageRating > 0 
    ? ((averageRating - prevAverageRating) / prevAverageRating) * 100 
    : averageRating > 0 ? 100 : 0;

  const responseRateChange = prevResponseRate > 0 
    ? ((responseRate - prevResponseRate) / prevResponseRate) * 100 
    : responseRate > 0 ? 100 : 0;

  const badReviewResponseRateChange = prevBadReviewResponseRate > 0
    ? ((badReviewResponseRate - prevBadReviewResponseRate) / prevBadReviewResponseRate) * 100
    : badReviewResponseRate > 0 ? 100 : 0;

  const venueMetrics = calculateVenueMetrics(reviews, daysAgo);

  return {
    totalReviews,
    averageRating,
    responseRate,
    badReviewResponseRate,
    monthOverMonth: {
      totalReviews: totalReviewsChange,
      averageRating: averageRatingChange,
      responseRate: responseRateChange,
      badReviewResponseRate: badReviewResponseRateChange
    },
    previousPeriodMetrics: {
      totalReviews: prevTotalReviews,
      averageRating: prevAverageRating,
      responseRate: prevResponseRate,
      badReviewResponseRate: prevBadReviewResponseRate
    },
    venueMetrics
  };
};

export const useReviewMetrics = (days: number = 30) => {
  const { data: reviewsData, isLoading: isReviewsLoading, error: reviewsError } = useReviews();

  return useQuery({
    queryKey: ["reviewMetrics", days],
    queryFn: () => {
      if (!reviewsData?.reviews) {
        return null;
      }
      return calculateMetrics(reviewsData.reviews, days);
    },
    enabled: !!reviewsData?.reviews,
  });
};