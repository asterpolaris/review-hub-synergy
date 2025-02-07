
export const convertRating = (rating: string | number): number => {
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

export const getRatingColor = (rating: number): string => {
  if (rating >= 4) return "text-green-500";
  if (rating === 3) return "text-yellow-500";
  return "text-red-500";
};
