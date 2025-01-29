import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VenueExperience } from "./VenueExperience";

interface BusinessCardProps {
  id: string;
  name: string;
  location: string;
  googleBusinessAccountId?: string | null;
}

export const BusinessCard = ({ id, name, location, googleBusinessAccountId }: BusinessCardProps) => {
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      // Add logic to connect business to Google account
      toast({
        title: "Success",
        description: "Business connected to Google successfully",
      });
    } catch (error) {
      console.error("Error connecting business:", error);
      toast({
        title: "Error",
        description: "Failed to connect business to Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-4">
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="experience">Client Experience</TabsTrigger>
        </TabsList>
        
        <TabsContent value="business">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium">{name}</h3>
              <p className="text-sm text-muted-foreground">{location}</p>
            </div>
            
            {googleBusinessAccountId ? (
              <span className="text-sm text-green-600">Connected to Google</span>
            ) : (
              <Button onClick={handleConnect} variant="outline" size="sm">
                Connect to Google
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="experience">
          <VenueExperience businessId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};