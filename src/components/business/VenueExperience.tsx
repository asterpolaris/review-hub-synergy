import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, X } from "lucide-react";
import type { VenueExperience as VenueExperienceType } from "@/types/venue";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

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

  const sections = [
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
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-semibold">{venue.venue}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <X className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
          {isEditing && (
            <Button variant="outline" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {sections.map((section, index) => (
          <AccordionItem value={`section-${index}`} key={index}>
            <AccordionTrigger className="text-lg font-medium">
              {section.title}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {section.content.map(({ label, value }) => 
                  value && (
                    <div key={label} className="flex justify-between items-start py-1">
                      <span className="text-sm font-medium text-muted-foreground">{label}</span>
                      <span className="text-sm text-right ml-4 max-w-[60%]">{value}</span>
                    </div>
                  )
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
};