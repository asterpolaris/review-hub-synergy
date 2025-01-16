import { BusinessCard } from "./BusinessCard";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Longer delay between retries and more retries
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
          // Much longer exponential backoff: 2^i * 2000ms (2s, 4s, 8s, 16s, 32s)
          const waitTime = Math.pow(2, i) * 2000;
          console.log(`Rate limited, attempt ${i + 1} of ${retries}. Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        // Add additional delay even for non-429 errors
        await delay(Math.pow(2, i) * 1000);
      }
    }
    throw new Error("Max retries reached");
  };

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

      const headers = {
        Authorization: `Bearer ${googleAuthToken.access_token}`,
      };

      // First, get the accounts with retry logic
      console.log("Fetching Google accounts...");
      const accountsData = await fetchWithRetry(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        { headers }
      );

      console.log("Google accounts:", accountsData);

      // For each account, get its locations with retry logic
      for (const account of accountsData.accounts) {
        try {
          console.log(`Fetching locations for account ${account.name}...`);
          const locationsData = await fetchWithRetry(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
            { headers }
          );

          console.log(`Locations for account ${account.name}:`, locationsData);

          // Store each location in Supabase
          for (const location of locationsData.locations) {
            const { error } = await supabase.from("businesses").insert({
              name: location.locationName,
              location: `${location.address.addressLines.join(", ")}, ${location.address.locality}, ${location.address.regionCode}`,
              google_place_id: location.name,
              google_business_account_id: account.name,
              user_id: session?.user.id,
            });

            if (error && error.code !== "23505") { // Ignore duplicate key errors
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
        description: "Failed to fetch Google businesses. Please wait a few minutes and try again.",
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