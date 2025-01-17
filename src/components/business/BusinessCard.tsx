import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BusinessCardProps {
  name: string;
  location: string;
  googleBusinessAccountId?: string | null;
}

export const BusinessCard = ({ name, location, googleBusinessAccountId }: BusinessCardProps) => {
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
    <div className="flex items-center justify-between py-4 border-b">
      <div className="flex-1">
        <h3 className="text-lg font-medium">{name || "Unnamed Location"}</h3>
        <p className="text-sm text-muted-foreground">{location || "Address not available"}</p>
      </div>
      
      {googleBusinessAccountId ? (
        <span className="text-sm text-green-600">Connected to Google</span>
      ) : (
        <Button onClick={handleConnect} variant="outline" size="sm">
          Connect to Google
        </Button>
      )}
    </div>
  );
};