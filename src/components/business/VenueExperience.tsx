import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface VenueExperienceProps {
  businessId: string;
}

export const VenueExperience = ({ businessId }: VenueExperienceProps) => {
  const { data: venue, isLoading } = useQuery({
    queryKey: ["venue-experience", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_experiences")
        .select("*")
        .eq("business_id", businessId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading venue information...</div>;
  }

  if (!venue) {
    return <div>No venue experience information available.</div>;
  }

  const infoSections = [
    {
      title: "Location & Access",
      items: [
        { label: "Address", value: venue.address },
        { label: "Closest Metro", value: venue.closest_metro },
        { label: "Parking", value: venue.parking_info },
        { label: "Wheelchair Accessible", value: venue.wheelchair_accessible ? "Yes" : "No" },
      ],
    },
    {
      title: "Venue Requirements",
      items: [
        { label: "Age Restriction", value: venue.age_restriction },
        { label: "Dress Code", value: venue.dress_code },
        { label: "Entrance Fee", value: venue.entrance_fee },
      ],
    },
    {
      title: "Dining Information",
      items: [
        { label: "Service Times", value: venue.dinner_service_times },
        { label: "Service Duration", value: venue.dinner_service_duration },
        { label: "Group Menu Minimum", value: venue.group_menu_minimum ? `${venue.group_menu_minimum} people` : "N/A" },
        { label: "Dietary Accommodations", value: venue.dietary_accommodations ? "Available" : "Not Available" },
        { label: "Halal/Kosher Options", value: venue.halal_kosher_options ? "Available" : "Not Available" },
      ],
    },
    {
      title: "Venue Features",
      items: [
        { label: "Private Rooms", value: venue.private_rooms },
        { label: "Performance Times", value: venue.performance_times },
        { label: "Nightclub Start", value: venue.nightclub_start_time },
        { label: "Guestlist End", value: venue.guestlist_end_time },
      ],
    },
    {
      title: "Seating & Service",
      items: [
        { label: "Bottle Service", value: venue.bottle_service_info },
        { label: "Booth Seating", value: venue.booth_seating_info },
      ],
    },
    {
      title: "Additional Information",
      items: [
        { label: "Nearby Hotels", value: venue.nearby_hotels },
        { label: "Other Recommendations", value: venue.other_recommendations },
        { label: "Additional Notes", value: venue.additional_notes },
      ],
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">{venue.venue}</h2>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-6">
          {infoSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map(({ label, value }) => (
                  value && (
                    <div key={label}>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-muted-foreground">{label}</span>
                        <span className="text-sm text-right ml-4">{value}</span>
                      </div>
                      <Separator className="my-2" />
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};