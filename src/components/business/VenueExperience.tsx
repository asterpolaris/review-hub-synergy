import { Card } from "@/components/ui/card";
import type { VenueExperience as VenueExperienceType } from "@/types/venue";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { VenueHeader } from "./venue/VenueHeader";
import { VenueSections } from "./venue/VenueSections";
import type { VenueSection } from "./venue/types";

interface VenueExperienceProps {
  venue: VenueExperienceType;
  onDelete: (id: string) => void;
}

export const VenueExperience = ({ venue, onDelete }: VenueExperienceProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    const { error } = await supabase
      .from('venue_experiences')
      .delete()
      .eq('id', venue.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete venue. Please try again.",
        variant: "destructive",
      });
      return;
    }

    onDelete(venue.id);
    toast({
      title: "Success",
      description: "Venue deleted successfully",
    });
  };

  const handleEditContent = async () => {
    toast({
      title: "Coming Soon",
      description: "The edit content feature will be available soon!",
    });
  };

  const sections: VenueSection[] = [
    {
      title: "Location & Access",
      content: [
        { label: "Address", value: venue.address },
        { label: "Closest Metro", value: venue.closest_metro },
        { label: "Parking", value: venue.parking_info },
        { label: "Wheelchair Accessible", value: venue.wheelchair_accessible ? "Yes" : "No" },
      ]
    },
    {
      title: "Venue Requirements",
      content: [
        { label: "Age Restriction", value: venue.age_restriction },
        { label: "Dress Code", value: venue.dress_code },
        { label: "Entrance Fee", value: venue.entrance_fee },
      ]
    },
    {
      title: "Dining Information",
      content: [
        { label: "Service Times", value: venue.dinner_service_times },
        { label: "Service Duration", value: venue.dinner_service_duration },
        { label: "Group Menu Minimum", value: venue.group_menu_minimum ? `${venue.group_menu_minimum} people` : "N/A" },
        { label: "Dietary Accommodations", value: venue.dietary_accommodations ? "Available" : "Not Available" },
        { label: "Halal/Kosher Options", value: venue.halal_kosher_options ? "Available" : "Not Available" },
      ]
    },
    {
      title: "Venue Features",
      content: [
        { label: "Private Rooms", value: venue.private_rooms },
        { label: "Performance Times", value: venue.performance_times },
        { label: "Nightclub Start", value: venue.nightclub_start_time },
        { label: "Guestlist End", value: venue.guestlist_end_time },
      ]
    },
    {
      title: "Seating & Service",
      content: [
        { label: "Bottle Service", value: venue.bottle_service_info },
        { label: "Booth Seating", value: venue.booth_seating_info },
      ]
    },
    {
      title: "Additional Information",
      content: [
        { label: "Nearby Hotels", value: venue.nearby_hotels },
        { label: "Other Recommendations", value: venue.other_recommendations },
        { label: "Additional Notes", value: venue.additional_notes },
      ]
    }
  ];

  return (
    <Card className="p-6">
      <VenueHeader
        venueName={venue.venue}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onDelete={handleDelete}
        onEditContent={handleEditContent}
      />
      <VenueSections sections={sections} />
    </Card>
  );
};