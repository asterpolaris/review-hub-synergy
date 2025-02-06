export type VenueExperience = {
  id: string;
  venue: string;
  address?: string;
  closest_metro?: string;
  parking_info?: string;
  age_restriction?: string;
  dress_code?: string;
  nearby_hotels?: string;
  dinner_service_times?: string;
  group_menu_minimum?: number;
  private_rooms?: string;
  performance_times?: string;
  nightclub_start_time?: string;
  guestlist_end_time?: string;
  bottle_service_info?: string;
  booth_seating_info?: string;
  dinner_service_duration?: string;
  wheelchair_accessible?: boolean;
  dietary_accommodations?: boolean;
  halal_kosher_options?: boolean;
  entrance_fee?: string;
  other_recommendations?: string;
  additional_notes?: string;
  business_id?: string;
  created_at: string;
  updated_at: string;
};

export type VenueSection = {
  title: string;
  items: Array<{
    label: string;
    value: string | number | boolean | null | undefined;
  }>;
};

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
