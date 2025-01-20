import { Review } from "@/types/review";
import { ReviewMetrics, VenueMetrics } from "@/types/metrics";

export const demoBusinesses = [
  {
    id: "1",
    name: "Sunset Beach Resort",
    location: "123 Ocean Drive, Miami Beach, FL",
    google_place_id: "demo_place_1",
    google_business_account_id: "demo_account_1",
    user_id: "demo_user",
  },
  {
    id: "2",
    name: "Mountain View Lodge",
    location: "456 Pine Road, Aspen, CO",
    google_place_id: "demo_place_2",
    google_business_account_id: "demo_account_2",
    user_id: "demo_user",
  },
];

export const demoReviews: Review[] = [
  {
    id: "review1",
    authorName: "John Smith",
    rating: 5,
    comment: "Amazing experience! The staff was incredibly friendly and helpful.",
    createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    venueName: "Sunset Beach Resort",
    placeId: "demo_place_1",
    reply: {
      comment: "Thank you for your wonderful review! We're glad you enjoyed your stay.",
      createTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "review2",
    authorName: "Emma Wilson",
    rating: 4,
    comment: "Great location and beautiful views. Room service could be faster.",
    createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    venueName: "Mountain View Lodge",
    placeId: "demo_place_2",
  },
  {
    id: "review3",
    authorName: "Michael Brown",
    rating: 3,
    comment: "Decent stay but needs some improvements in maintenance.",
    createTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    venueName: "Sunset Beach Resort",
    placeId: "demo_place_1",
  },
];

export const demoMetrics: ReviewMetrics = {
  totalReviews: 150,
  averageRating: 4.2,
  responseRate: 85,
  badReviewResponseRate: 92,
  monthOverMonth: {
    totalReviews: 15,
    averageRating: 5.2,
    responseRate: 10,
    badReviewResponseRate: 15,
  },
  previousPeriodMetrics: {
    totalReviews: 135,
    averageRating: 4.0,
    responseRate: 75,
    badReviewResponseRate: 77,
  },
  venueMetrics: [
    {
      name: "Sunset Beach Resort",
      totalReviews: 85,
      averageRating: 4.3,
      responseRate: 88,
      badReviewResponseRate: 95,
      monthOverMonth: {
        totalReviews: 10,
        averageRating: 7.5,
        responseRate: 12,
        badReviewResponseRate: 18,
      },
      previousPeriodMetrics: {
        totalReviews: 75,
        averageRating: 4.0,
        responseRate: 76,
        badReviewResponseRate: 77,
      },
    },
    {
      name: "Mountain View Lodge",
      totalReviews: 65,
      averageRating: 4.1,
      responseRate: 82,
      badReviewResponseRate: 89,
      monthOverMonth: {
        totalReviews: 5,
        averageRating: 2.5,
        responseRate: 8,
        badReviewResponseRate: 12,
      },
      previousPeriodMetrics: {
        totalReviews: 60,
        averageRating: 4.0,
        responseRate: 74,
        badReviewResponseRate: 77,
      },
    },
  ],
};