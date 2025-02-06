import { VenueName } from "./venue";

export interface Review {
  id: string;
  googleReviewId: string;
  authorName: string;
  rating: number;
  comment: string;
  createTime: string;
  photoUrls?: string[];
  reply?: {
    comment: string;
    createTime: string;
  };
  venueName: VenueName;
  placeId: string;
  status: 'pending' | 'replied' | 'archived';
}