export interface VenueSection {
  title: string;
  content: Array<{
    label: string;
    value: string | number | boolean | null | undefined;
  }>;
}