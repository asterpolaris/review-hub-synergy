import { BusinessCard } from "./BusinessCard";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const BusinessList = () => {
  const { data: businesses, isLoading } = useBusinesses();
  const { session, googleAuthToken } = useAuth();
  const { toast } = useToast();

  const fetchWithRetry = async (url: string, options: RequestInit, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          const waitTime = Math.pow(2, i) * 2000;
          console.log(`Rate limited, attempt ${i + 1} of ${retries}. Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`API Error: ${errorText}`);
        }

        const data = await response.json();
        console.log(`API Response for ${url}:`, data);
        return data;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await delay(Math.pow(2, i) * 1000);
      }
    }
    throw new Error("Max retries reached");
  };

  const fetchGoogleBusinesses = async () => {
    try {
      console.log("Starting fetchGoogleBusinesses function");
      console.log("Google Auth Token:", googleAuthToken);
      
      if (!googleAuthToken?.access_token) {
        console.error("No Google auth token found");
        toast({
          title: "Error",
          description: "Please connect your Google account first",
          variant: "destructive",
        });
        return;
      }

      const headers = {
        Authorization: `Bearer ${googleAuthToken.access_token}`,
        'Content-Type': 'application/json',
      };

      console.log("Fetching Google accounts...");
      const accountsData = await fetchWithRetry(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        { headers }
      );

      console.log("Google accounts response:", accountsData);

      if (!accountsData.accounts || accountsData.accounts.length === 0) {
        console.log("No Google Business accounts found");
        toast({
          title: "No businesses found",
          description: "No Google Business accounts were found for your account.",
          variant: "destructive",
        });
        return;
      }

      for (const account of accountsData.accounts) {
        try {
          console.log(`Fetching locations for account ${account.name}...`);
          const locationsData = await fetchWithRetry(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name`,
            { headers }
          );

          console.log(`Locations for account ${account.name}:`, locationsData);

          if (!locationsData.locations || locationsData.locations.length === 0) {
            console.log(`No locations found for account ${account.name}`);
            continue;
          }

          for (const location of locationsData.locations) {
            console.log("Fetching details for location:", location.name);
            const locationDetails = await fetchWithRetry(
              `https://mybusinessbusinessinformation.googleapis.com/v1/${location.name}?readMask=profile.locationName,profile.address`,
              { headers }
            );

            console.log("Location details:", locationDetails);

            const { error } = await supabase.from("businesses").insert({
              name: locationDetails.profile?.locationName || "Unnamed Location",
              location: locationDetails.profile?.address ? 
                `${locationDetails.profile.address.addressLines?.join(", ")}, ${locationDetails.profile.address.locality}, ${locationDetails.profile.address.regionCode}` 
                : "Address not available",
              google_place_id: location.name,
              google_business_account_id: account.name,
              user_id: session?.user.id,
            });

            if (error && error.code !== "23505") {
              console.error("Error storing location:", error);
            }
          }
        } catch (error) {
          console.error(`Error fetching locations for account ${account.name}:`, error);
          toast({
            title: "Warning",
            description: `Failed to fetch some locations. Please try again later.`,
            variant: "destructive",
          });
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