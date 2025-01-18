import { useQuery } from "@tanstack/react-query";
import { useReviews } from "./useReviews";
import { Review } from "@/types/review";

interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  monthOverMonth: {
    totalReviews: number;
    averageRating: number;
    responseRate: number;
  };
}

const calculateMetrics = (reviews: Review[], daysAgo: number): ReviewMetrics => {
  const now = new Date();
  const startDate = new Date(now.setDate(now.getDate() - daysAgo));
  
  // Filter reviews for current period
  const periodReviews = reviews.filter(review => 
    new Date(review.createTime) >= startDate
  );

  // Filter reviews for previous period
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - daysAgo);
  const previousPeriodReviews = reviews.filter(review => 
    new Date(review.createTime) >= previousStartDate &&
    new Date(review.createTime) < startDate
  );

  // Calculate current period metrics
  const totalReviews = periodReviews.length;
  const averageRating = totalReviews > 0
    ? periodReviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
    : 0;
  const responseRate = totalReviews > 0
    ? (periodReviews.filter(review => review.reply).length / totalReviews) * 100
    : 0;

  // Calculate previous period metrics
  const prevTotalReviews = previousPeriodReviews.length;
  const prevAverageRating = prevTotalReviews > 0
    ? previousPeriodReviews.reduce((acc, review) => acc + review.rating, 0) / prevTotalReviews
    : 0;
  const prevResponseRate = prevTotalReviews > 0
    ? (previousPeriodReviews.filter(review => review.reply).length / prevTotalReviews) * 100
    : 0;

  return {
    totalReviews,
    averageRating,
    responseRate,
    monthOverMonth: {
      totalReviews: prevTotalReviews > 0 
        ? ((totalReviews - prevTotalReviews) / prevTotalReviews) * 100 
        : 0,
      averageRating: prevAverageRating > 0 
        ? ((averageRating - prevAverageRating) / prevAverageRating) * 100 
        : 0,
      responseRate: prevResponseRate > 0 
        ? ((responseRate - prevResponseRate) / prevResponseRate) * 100 
        : 0
    }
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