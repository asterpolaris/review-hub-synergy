import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VenueExperience } from "@/components/business/VenueExperience";

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

  if (!venueExperiences?.length) {
    return (
      <AppLayout>
        <div className="text-center py-12">No venue experiences available.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <h1 className="text-4xl font-semibold tracking-tight">Client Experience</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venueExperiences.map((venue) => (
            <VenueExperience key={venue.id} venue={venue} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default ClientExperience;