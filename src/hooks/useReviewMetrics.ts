import { useQuery } from "@tanstack/react-query";
import { useReviews } from "./useReviews";
import { ReviewMetrics } from "@/types/metrics";
import { calculatePeriodMetrics, calculateMetricVariance, calculateVenueMetrics } from "@/utils/metricCalculations";

export const useReviewMetrics = (period: string = 'last-30-days') => {
  const { data: reviewsData, isLoading: isReviewsLoading, error: reviewsError } = useReviews();

  return useQuery({
    queryKey: ["reviewMetrics", period],
    queryFn: () => {
      if (!reviewsData?.reviews) {
        console.log("No reviews data available");
        return null;
      }

      console.log("Raw reviews data:", reviewsData.reviews);

      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;

      switch (period) {
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
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

      const periodReviews = reviewsData.reviews.filter(review => {
        const reviewDate = new Date(review.createTime);
        return reviewDate >= startDate && reviewDate <= now;
      });

      console.log("Filtered period reviews:", periodReviews);

      const previousPeriodReviews = reviewsData.reviews.filter(review => {
        const reviewDate = new Date(review.createTime);
        return reviewDate >= previousStartDate && reviewDate < startDate;
      });

      console.log("Previous period reviews:", previousPeriodReviews);

      const currentMetrics = calculatePeriodMetrics(periodReviews);
      console.log("Current period metrics:", currentMetrics);

      const previousMetrics = calculatePeriodMetrics(previousPeriodReviews);
      console.log("Previous period metrics:", previousMetrics);

      const monthOverMonth = calculateMetricVariance(currentMetrics, previousMetrics);
      const venueMetrics = calculateVenueMetrics(reviewsData.reviews, period);

      console.log("Venue metrics:", venueMetrics);

      // Use the current_rating from the businesses data instead of calculating it
      const metrics: ReviewMetrics = {
        ...currentMetrics,
        currentRating: reviewsData.businesses[0]?.current_rating || 0,
        monthOverMonth,
        previousPeriodMetrics: previousMetrics,
        venueMetrics: venueMetrics.map(venue => ({
          ...venue,
          // Override the currentRating with the one from the database
          currentRating: reviewsData.businesses.find(b => b.name === venue.name)?.current_rating || 0
        }))
      };

      return metrics;
    },
    enabled: !!reviewsData?.reviews,
    // Disable caching
    staleTime: 0,
    cacheTime: 0,
  });
};