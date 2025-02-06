export type VenueName = 
  | "Bordelle"
  | "Raspoutine Paris"
  | "Raspoutine LA"
  | "Raspoutine Miami"
  | "Raspoutine Dubai"
  | "Bagatelle London"
  | "Bagatelle Miami"
  | "Bagatelle Dubai"
  | "Bagatelle St Barths"
  | "Bagatelle St Tropez"
  | "Caviar Kaspia LA"
  | "Caviar Kaspia Dubai"
  | "Caviar Kaspia NY"
  | "Caviar Kaspia London"
  | "Caviar Kaspia Paris"
  | "Stk London"
  | "Stk Ibiza"
  | "Unknown Venue";

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