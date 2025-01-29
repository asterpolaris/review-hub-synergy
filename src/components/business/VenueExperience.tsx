import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VenueExperienceProps {
  businessId?: string;
}

export const VenueExperience = ({ businessId }: VenueExperienceProps) => {
  const { data: venueExperience, isLoading } = useQuery({
    queryKey: ["venue-experience", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_experiences")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading venue information...</div>;
  }

  if (!venueExperience) {
    return <div className="text-center py-4">No venue experience information available.</div>;
  }

  const infoSections = [
    {
      title: "Location & Access",
      items: [
        { label: "Address", value: venueExperience.address },
        { label: "Closest Metro", value: venueExperience.closest_metro },
        { label: "Parking", value: venueExperience.parking_info },
        { label: "Wheelchair Accessible", value: venueExperience.wheelchair_accessible ? "Yes" : "No" },
      ],
    },
    {
      title: "Venue Requirements",
      items: [
        { label: "Age Restriction", value: venueExperience.age_restriction },
        { label: "Dress Code", value: venueExperience.dress_code },
        { label: "Entrance Fee", value: venueExperience.entrance_fee },
      ],
    },
    {
      title: "Dining Information",
      items: [
        { label: "Service Times", value: venueExperience.dinner_service_times },
        { label: "Service Duration", value: venueExperience.dinner_service_duration },
        { label: "Group Menu Minimum", value: venueExperience.group_menu_minimum ? `${venueExperience.group_menu_minimum} people` : "N/A" },
        { label: "Dietary Accommodations", value: venueExperience.dietary_accommodations ? "Available" : "Not Available" },
        { label: "Halal/Kosher Options", value: venueExperience.halal_kosher_options ? "Available" : "Not Available" },
      ],
    },
    {
      title: "Venue Features",
      items: [
        { label: "Private Rooms", value: venueExperience.private_rooms },
        { label: "Performance Times", value: venueExperience.performance_times },
        { label: "Nightclub Start", value: venueExperience.nightclub_start_time },
        { label: "Guestlist End", value: venueExperience.guestlist_end_time },
      ],
    },
    {
      title: "Seating & Service",
      items: [
        { label: "Bottle Service", value: venueExperience.bottle_service_info },
        { label: "Booth Seating", value: venueExperience.booth_seating_info },
      ],
    },
    {
      title: "Additional Information",
      items: [
        { label: "Nearby Hotels", value: venueExperience.nearby_hotels },
        { label: "Other Recommendations", value: venueExperience.other_recommendations },
        { label: "Additional Notes", value: venueExperience.additional_notes },
      ],
    },
  ];

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6">
        {infoSections.map((section) => (
          <Card key={section.title} className="p-4">
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
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};