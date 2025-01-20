import { Review } from "@/types/review";
import { PeriodMetrics, VenueMetrics } from "@/types/metrics";
import { convertGoogleRating } from "./reviewUtils";

export const calculatePeriodMetrics = (reviews: Review[]): PeriodMetrics => {
  console.log("Calculating period metrics for reviews:", reviews);
  
  if (reviews.length === 0) {
    console.log("No reviews found, returning zero metrics");
    return {
      totalReviews: 0,
      averageRating: 0,
      responseRate: 0,
      badReviewResponseRate: 0
    };
  }

  const totalReviews = reviews.length;
  const totalRating = reviews.reduce((acc, review) => {
    const numericRating = convertGoogleRating(review.rating);
    console.log(`Adding rating: ${review.rating} (${numericRating}) to accumulator: ${acc}`);
    return acc + numericRating;
  }, 0);
  
  const averageRating = totalRating / totalReviews;
  console.log(`Calculated average rating: ${averageRating} (total: ${totalRating} / count: ${totalReviews})`);

  const responseRate = (reviews.filter(review => review.reply).length / totalReviews) * 100;
  
  const badReviews = reviews.filter(review => convertGoogleRating(review.rating) <= 3);
  const badReviewResponseRate = badReviews.length > 0 
    ? (badReviews.filter(review => review.reply).length / badReviews.length) * 100
    : 0;

  return {
    totalReviews,
    averageRating: isNaN(averageRating) ? 0 : averageRating,
    responseRate,
    badReviewResponseRate
  };
};

export const calculateMetricVariance = (current: PeriodMetrics, previous: PeriodMetrics) => {
  const calculateVariance = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return 0;
      return 100;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  return {
    totalReviews: calculateVariance(current.totalReviews, previous.totalReviews),
    averageRating: calculateVariance(current.averageRating, previous.averageRating),
    responseRate: calculateVariance(current.responseRate, previous.responseRate),
    badReviewResponseRate: calculateVariance(current.badReviewResponseRate, previous.badReviewResponseRate)
  };
};

export const calculateVenueMetrics = (reviews: Review[], period: string): VenueMetrics[] => {
  const now = new Date();
  let startDate: Date;
  let previousStartDate: Date;

  switch (period) {
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
      break;
    case 'last-year':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      previousStartDate = new Date(now.getFullYear() - 2, 0, 1);
      break;
    case 'lifetime':
      startDate = new Date(now.getFullYear() - 2, 0, 1);
      previousStartDate = new Date(now.getFullYear() - 3, 0, 1);
      break;
    default: // 'last-30-days'
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      previousStartDate = new Date(startDate.getTime() - (30 * 24 * 60 * 60 * 1000));
  }

  const venueReviews = reviews.reduce((acc, review) => {
    if (!acc[review.venueName]) {
      acc[review.venueName] = [];
    }
    acc[review.venueName].push(review);
    return acc;
  }, {} as { [key: string]: Review[] });

  return Object.entries(venueReviews).map(([venueName, venueReviews]) => {
    // Calculate current rating using all reviews
    const allReviewsRating = venueReviews.reduce((acc, review) => acc + convertGoogleRating(review.rating), 0) / venueReviews.length;

    const periodReviews = venueReviews.filter(review => {
      const reviewDate = new Date(review.createTime);
      return reviewDate >= startDate && reviewDate <= now;
    });

    const previousPeriodReviews = venueReviews.filter(review => {
      const reviewDate = new Date(review.createTime);
      return reviewDate >= previousStartDate && reviewDate < startDate;
    });

    const currentMetrics = calculatePeriodMetrics(periodReviews);
    const previousMetrics = calculatePeriodMetrics(previousPeriodReviews);
    const monthOverMonth = calculateMetricVariance(currentMetrics, previousMetrics);

    return {
      name: venueName,
      ...currentMetrics,
      currentRating: allReviewsRating,
      monthOverMonth,
      previousPeriodMetrics: previousMetrics
    };
  });
};