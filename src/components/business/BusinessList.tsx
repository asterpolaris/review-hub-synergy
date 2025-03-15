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
          throw new Error(`We're having trouble connecting to Google. Please try again in a few minutes.`);
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
    throw new Error("We couldn't reach Google after several attempts. Please try again later.");
  };

  const fetchGoogleBusinesses = async () => {
    try {
      console.log("Starting fetchGoogleBusinesses function");
      console.log("Google Auth Token:", googleAuthToken);
      
      if (!googleAuthToken?.access_token) {
        console.error("No Google auth token found");
        toast({
          title: "Connection needed",
          description: "Please connect your Google Business Profile first to see your businesses.",
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
          description: "We couldn't find any businesses connected to your Google Business Profile. Make sure you have access to manage the businesses you want to connect.",
          variant: "destructive",
        });
        return;
      }

      let addedCount = 0;
      let errorCount = 0;

      for (const account of accountsData.accounts) {
        try {
          console.log(`Fetching locations for account ${account.name}...`);
          const locationsData = await fetchWithRetry(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storefrontAddress`,
            { headers }
          );

          console.log(`Locations for account ${account.name}:`, locationsData);

          if (!locationsData.locations || locationsData.locations.length === 0) {
            console.log(`No locations found for account ${account.name}`);
            continue;
          }

          for (const location of locationsData.locations) {
            console.log("Processing location:", location);

            if (!location.title) {
              console.log(`Skipping location with no name: ${location.name}`);
              continue;
            }

            // Extract and format address
            let formattedAddress = "";
            if (location.storefrontAddress) {
              const address = location.storefrontAddress;
              const addressParts = [];

              if (address.addressLines?.length > 0) {
                addressParts.push(...address.addressLines);
              }
              if (address.locality) {
                addressParts.push(address.locality);
              }
              if (address.administrativeArea) {
                addressParts.push(address.administrativeArea);
              }
              if (address.postalCode) {
                addressParts.push(address.postalCode);
              }
              if (address.regionCode) {
                addressParts.push(address.regionCode);
              }

              formattedAddress = addressParts.join(", ");
            }

            if (!formattedAddress) {
              formattedAddress = "Address not provided";
            }

            // Check if business already exists
            const { data: existingBusiness } = await supabase
              .from("businesses")
              .select("id")
              .eq("google_place_id", location.name)
              .eq("user_id", session?.user.id)
              .single();

            if (!existingBusiness) {
              const { error } = await supabase.from("businesses").insert({
                name: location.title,
                location: formattedAddress,
                google_place_id: location.name,
                google_business_account_id: account.name,
                user_id: session?.user.id,
              });

              if (error) {
                console.error("Error storing location:", error);
                errorCount++;
              } else {
                console.log(`Successfully saved business: ${location.title}`);
                addedCount++;
              }
            } else {
              console.log(`Business ${location.title} already exists, skipping`);
            }
          }
        } catch (error) {
          console.error(`Error fetching locations for account ${account.name}:`, error);
          errorCount++;
        }
      }

      await refetch();
      
      if (addedCount > 0) {
        toast({
          title: "Success!",
          description: `We've imported ${addedCount} new business${addedCount === 1 ? '' : 'es'}${errorCount > 0 ? `. ${errorCount} couldn't be imported.` : ''}`,
        });
      } else {
        toast({
          title: "No new businesses imported",
          description: "All your Google Business Profile locations are already imported.",
        });
      }
    } catch (error) {
      console.error("Error fetching Google businesses:", error);
      toast({
        title: "Connection issue",
        description: "We're having trouble connecting to Google. Please try again in a few minutes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading your businesses...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {googleAuthToken && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchGoogleBusinesses} variant="outline">
            Refresh Google Business List
          </Button>
        </div>
      )}
      
      {!businesses?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          No businesses added yet. Click the button above to import your businesses from Google.
        </div>
      ) : (
        <div className="divide-y border-t border-b">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              id={business.id}
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
