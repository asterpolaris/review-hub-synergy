import { BusinessCard } from "./BusinessCard";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const BusinessList = () => {
  const { data: businesses, isLoading, refetch } = useBusinesses();
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

      // Get existing businesses for deduplication
      const { data: existingBusinesses } = await supabase
        .from("businesses")
        .select("google_place_id")
        .eq("user_id", session?.user.id);

      const existingPlaceIds = new Set(existingBusinesses?.map(b => b.google_place_id) || []);

      for (const account of accountsData.accounts) {
        try {
          console.log(`Fetching locations for account ${account.name}...`);
          // Request all necessary fields in the readMask
          const locationsData = await fetchWithRetry(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,profile.locationName,profile.address`,
            { headers }
          );

          console.log(`Locations for account ${account.name}:`, locationsData);

          if (!locationsData.locations || locationsData.locations.length === 0) {
            console.log(`No locations found for account ${account.name}`);
            continue;
          }

          for (const location of locationsData.locations) {
            if (existingPlaceIds.has(location.name)) {
              console.log(`Skipping existing location: ${location.name}`);
              continue;
            }

            console.log("Processing location:", location);

            if (!location.profile?.locationName) {
              console.log(`Skipping location with no name: ${location.name}`);
              continue;
            }

            let formattedAddress = "";
            const address = location.profile.address;
            
            if (address) {
              const addressParts = [];
              
              if (address.addressLines?.length > 0) {
                addressParts.push(...address.addressLines);
              }
              if (address.locality) {
                addressParts.push(address.locality);
              }
              if (address.regionCode) {
                addressParts.push(address.regionCode);
              }
              if (address.postalCode) {
                addressParts.push(address.postalCode);
              }
              
              formattedAddress = addressParts.join(", ");
            }

            if (!formattedAddress) {
              console.log(`No address found for location: ${location.profile.locationName}`);
              continue;
            }

            const { error } = await supabase.from("businesses").insert({
              name: location.profile.locationName,
              location: formattedAddress,
              google_place_id: location.name,
              google_business_account_id: account.name,
              user_id: session?.user.id,
            });

            if (error) {
              console.error("Error storing location:", error);
              toast({
                title: "Error",
                description: `Failed to save business: ${location.profile.locationName}`,
                variant: "destructive",
              });
            } else {
              console.log(`Successfully saved business: ${location.profile.locationName}`);
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

      await refetch();
      
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
      <div className="text-center py-12 text-muted-foreground">
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
        <div className="divide-y border-t border-b">
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