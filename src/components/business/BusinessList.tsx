import { BusinessCard } from "./BusinessCard";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const BusinessList = () => {
  const { data: businesses, isLoading } = useBusinesses();
  const { googleAuthToken } = useAuth();
  const { toast } = useToast();

  const fetchGoogleBusinesses = async () => {
    try {
      if (!googleAuthToken?.access_token) {
        toast({
          title: "Error",
          description: "Please connect your Google account first",
          variant: "destructive",
        });
        return;
      }

      // Fetch businesses from Google Business Profile API
      const response = await fetch(
        "https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations",
        {
          headers: {
            Authorization: `Bearer ${googleAuthToken.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Google businesses");
      }

      const data = await response.json();
      console.log("Google businesses:", data);

      // TODO: Add logic to store selected businesses in Supabase
      toast({
        title: "Success",
        description: "Retrieved Google businesses successfully",
      });
    } catch (error) {
      console.error("Error fetching Google businesses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Google businesses",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        Loading businesses...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {googleAuthToken && (
        <Button onClick={fetchGoogleBusinesses} variant="outline">
          Import from Google Business Profile
        </Button>
      )}
      
      {!businesses?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          No businesses added yet. Click the button above to add your first
          business.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              name={business.name}
              location={business.location}
              googleBusinessAccountId={business.google_business_account_id}
            />
          ))}
        </div>
      )}
    </div>
  );
};