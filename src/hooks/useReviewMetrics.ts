import { useQuery } from "@tanstack/react-query";
import { useReviews } from "./useReviews";
import { ReviewMetrics } from "@/types/metrics";
import { calculatePeriodMetrics, calculateMetricVariance, calculateVenueMetrics } from "@/utils/metricCalculations";

export const useReviewMetrics = (days: number = 30) => {
  const { data: reviewsData, isLoading: isReviewsLoading, error: reviewsError } = useReviews();

  return useQuery({
    queryKey: ["reviewMetrics", days],
    queryFn: () => {
      if (!reviewsData?.reviews) {
        return null;
      }

      const now = new Date();
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      const previousStartDate = new Date(startDate.getTime() - (days * 24 * 60 * 60 * 1000));

      const periodReviews = reviewsData.reviews.filter(review => {
        const reviewDate = new Date(review.createTime);
        return reviewDate >= startDate && reviewDate <= now;
      });

      const previousPeriodReviews = reviewsData.reviews.filter(review => {
        const reviewDate = new Date(review.createTime);
        return reviewDate >= previousStartDate && reviewDate < startDate;
      });

      const currentMetrics = calculatePeriodMetrics(periodReviews);
      const previousMetrics = calculatePeriodMetrics(previousPeriodReviews);
      const monthOverMonth = calculateMetricVariance(currentMetrics, previousMetrics);
      const venueMetrics = calculateVenueMetrics(reviewsData.reviews, days);

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