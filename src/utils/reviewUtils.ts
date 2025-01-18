import { Review } from "@/types/review";

export const convertGoogleRating = (rating: string | number): number => {
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

export const filterReviewsByDate = (reviews: Review[], startDate: Date): Review[] => {
  return reviews.filter(review => 
    new Date(review.createTime).getTime() >= startDate.getTime()
  );
};

export const calculateResponseRate = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  return (reviews.filter(review => review.reply).length / reviews.length) * 100;
};

export const calculateBadReviewResponseRate = (reviews: Review[]): number => {
  const badReviews = reviews.filter(review => convertGoogleRating(review.rating) <= 3);
  if (badReviews.length === 0) return 0;
  return (badReviews.filter(review => review.reply).length / badReviews.length) * 100;
};

export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  return reviews.reduce((acc, review) => acc + convertGoogleRating(review.rating), 0) / reviews.length;
};