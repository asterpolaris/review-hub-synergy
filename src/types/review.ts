export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createTime: string;
  photoUrls?: string[];
  reply?: {
    comment: string;
    createTime: string;
  };
}