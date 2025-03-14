
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
  venueName: string;
  placeId: string;
  syncStatus?: 'synced' | 'pending_reply_sync' | 'reply_sync_failed';
}
