import { useQuery } from "@tanstack/react-query";
import { useReviews } from "./useReviews";
import { ReviewMetrics } from "@/types/metrics";
import { calculatePeriodMetrics, calculateMetricVariance, calculateVenueMetrics } from "@/utils/metricCalculations";

export const useReviewMetrics = (period: string = 'last-month') => {
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
      let endDate: Date;

      // Calculate the start and end dates based on the period
      switch (period) {
        case 'last-month':
          // Start date is first day of previous month
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          // End date is last day of previous month
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          // Previous period starts at first day of two months ago
          previousStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
          break;
        case 'last-year':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          previousStartDate = new Date(now.getFullYear() - 2, 0, 1);
          break;
        case 'lifetime':
          startDate = new Date(0); // Beginning of time
          endDate = now;
          previousStartDate = new Date(0);
          break;
        default: // 'last-30-days'
          startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          endDate = now;
          previousStartDate = new Date(startDate.getTime() - (30 * 24 * 60 * 60 * 1000));
      }

      console.log("Period dates:", {
        period,
        startDate,
        endDate,
        previousStartDate
      });

      const periodReviews = reviewsData.reviews.filter(review => {
        const reviewDate = new Date(review.createTime);
        return reviewDate >= startDate && reviewDate <= endDate;
      });

      console.log("Filtered period reviews:", periodReviews.length);

      const previousPeriodReviews = reviewsData.reviews.filter(review => {
        const reviewDate = new Date(review.createTime);
        const previousPeriodEndDate = new Date(startDate);
        previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 1);
        return reviewDate >= previousStartDate && reviewDate <= previousPeriodEndDate;
      });

      console.log("Previous period reviews:", previousPeriodReviews.length);

      const currentMetrics = calculatePeriodMetrics(periodReviews);
      console.log("Current period metrics:", currentMetrics);

      const previousMetrics = calculatePeriodMetrics(previousPeriodReviews);
      console.log("Previous period metrics:", previousMetrics);

      const monthOverMonth = calculateMetricVariance(currentMetrics, previousMetrics);
      const venueMetrics = calculateVenueMetrics(reviewsData.reviews, period);

      console.log("Venue metrics:", venueMetrics);

      const metrics: ReviewMetrics = {
        ...currentMetrics,
        monthOverMonth,
        previousPeriodMetrics: previousMetrics,
        venueMetrics
      };

      return metrics;
    },
    enabled: !!reviewsData?.reviews,
  });
};