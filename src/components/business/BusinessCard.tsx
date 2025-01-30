import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BusinessCardProps {
  id: string;
  name: string;
  location?: string;
  googleBusinessAccountId?: string;
}

export const BusinessCard = ({ id, name, location, googleBusinessAccountId }: BusinessCardProps) => {
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const response = await fetch(`/api/google/connect/${id}`);
      if (!response.ok) throw new Error('Failed to connect business');
      
      toast({
        title: "Success",
        description: "Business connected successfully",
      });
    } catch (error) {
      console.error('Error connecting business:', error);
      toast({
        title: "Error",
        description: "Failed to connect business. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-2xl font-semibold">{name}</h3>
        {location && <p className="text-sm text-muted-foreground mt-2">{location}</p>}
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Google Business Account</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {googleBusinessAccountId ? (
                  "Connected"
                ) : (
                  <button
                    onClick={handleConnect}
                    className="text-primary hover:underline"
                  >
                    Connect to Google Business
                  </button>
                )}
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="reviews">
          <div className="p-6">
            <p>Reviews will be displayed here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};