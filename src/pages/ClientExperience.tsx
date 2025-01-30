import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VenueExperience } from "@/components/business/VenueExperience";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientExperience = () => {
  const { toast } = useToast();
  const { data: venueExperiences, isLoading, refetch } = useQuery({
    queryKey: ["venue-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_experiences")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  const handleAddVenue = async () => {
    try {
      const { error } = await supabase
        .from("venue_experiences")
        .insert([
          {
            venue: "Bordelle",
            address: "",
            closest_metro: "",
            parking_info: "",
            age_restriction: "",
            dress_code: "",
            entrance_fee: "",
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "New venue added successfully",
      });

      refetch();
    } catch (error) {
      console.error('Error adding venue:', error);
      toast({
        title: "Error",
        description: "Failed to add venue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center py-12">Loading venue information...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Client Experience</h1>
          <Button onClick={handleAddVenue}>
            <Plus className="h-4 w-4 mr-2" />
            Add Venue
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {venueExperiences?.map((venue) => (
            <VenueExperience 
              key={venue.id} 
              venue={venue} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default ClientExperience;