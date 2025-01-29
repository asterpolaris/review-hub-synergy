import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const ClientExperience = () => {
  const { data: venueExperiences, isLoading } = useQuery({
    queryKey: ["venue-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_experiences")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center py-12">Loading venue information...</div>
      </AppLayout>
    );
  }

  const infoSections = [
    {
      title: "Location & Access",
      items: (venue: any) => [
        { label: "Address", value: venue.address },
        { label: "Closest Metro", value: venue.closest_metro },
        { label: "Parking", value: venue.parking_info },
        { label: "Wheelchair Accessible", value: venue.wheelchair_accessible ? "Yes" : "No" },
      ],
    },
    {
      title: "Venue Requirements",
      items: (venue: any) => [
        { label: "Age Restriction", value: venue.age_restriction },
        { label: "Dress Code", value: venue.dress_code },
        { label: "Entrance Fee", value: venue.entrance_fee },
      ],
    },
    {
      title: "Dining Information",
      items: (venue: any) => [
        { label: "Service Times", value: venue.dinner_service_times },
        { label: "Service Duration", value: venue.dinner_service_duration },
        { label: "Group Menu Minimum", value: venue.group_menu_minimum ? `${venue.group_menu_minimum} people` : "N/A" },
        { label: "Dietary Accommodations", value: venue.dietary_accommodations ? "Available" : "Not Available" },
        { label: "Halal/Kosher Options", value: venue.halal_kosher_options ? "Available" : "Not Available" },
      ],
    },
    {
      title: "Venue Features",
      items: (venue: any) => [
        { label: "Private Rooms", value: venue.private_rooms },
        { label: "Performance Times", value: venue.performance_times },
        { label: "Nightclub Start", value: venue.nightclub_start_time },
        { label: "Guestlist End", value: venue.guestlist_end_time },
      ],
    },
    {
      title: "Seating & Service",
      items: (venue: any) => [
        { label: "Bottle Service", value: venue.bottle_service_info },
        { label: "Booth Seating", value: venue.booth_seating_info },
      ],
    },
    {
      title: "Additional Information",
      items: (venue: any) => [
        { label: "Nearby Hotels", value: venue.nearby_hotels },
        { label: "Other Recommendations", value: venue.other_recommendations },
        { label: "Additional Notes", value: venue.additional_notes },
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <h1 className="text-4xl font-semibold tracking-tight">Client Experience</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venueExperiences?.map((venue) => (
            <Card key={venue.id} className="p-6">
              <h2 className="text-2xl font-semibold mb-4">{venue.venue}</h2>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {infoSections.map((section) => (
                    <div key={section.title}>
                      <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
                      <div className="space-y-2">
                        {section.items(venue).map(({ label, value }) => (
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
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default ClientExperience;