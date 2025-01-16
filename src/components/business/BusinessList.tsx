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

      // First, get the accounts
      const accountsResponse = await fetch(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        {
          headers: {
            Authorization: `Bearer ${googleAuthToken.access_token}`,
          },
        }
      );

      if (!accountsResponse.ok) {
        throw new Error("Failed to fetch Google accounts");
      }

      const accountsData = await accountsResponse.json();
      console.log("Google accounts:", accountsData);

      // For each account, get its locations
      for (const account of accountsData.accounts) {
        const locationsResponse = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
          {
            headers: {
              Authorization: `Bearer ${googleAuthToken.access_token}`,
            },
          }
        );

        if (!locationsResponse.ok) {
          console.error(`Failed to fetch locations for account ${account.name}`);
          continue;
        }

        const locationsData = await locationsResponse.json();
        console.log(`Locations for account ${account.name}:`, locationsData);

        // Store each location in Supabase
        for (const location of locationsData.locations) {
          const { error } = await supabase.from("businesses").insert({
            name: location.locationName,
            location: `${location.address.addressLines.join(", ")}, ${location.address.locality}, ${location.address.regionCode}`,
            google_place_id: location.name,
            google_business_account_id: account.name,
          });

          if (error && error.code !== "23505") { // Ignore duplicate key errors
            console.error("Error storing location:", error);
          }
        }
      }

      toast({
        title: "Success",
        description: "Successfully imported Google businesses",
      });
    } catch (error) {
      console.error("Error fetching Google businesses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Google businesses. Please try again.",
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