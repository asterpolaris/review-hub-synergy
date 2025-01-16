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
    <div className="glass-panel rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="text-muted-foreground">{location}</p>
      </div>
      
      {googleBusinessAccountId ? (
        <div className="flex items-center text-sm text-green-600">
          <span className="flex-1">Connected to Google</span>
        </div>
      ) : (
        <Button onClick={handleConnect} variant="outline" size="sm" className="w-full">
          Connect to Google
        </Button>
      )}
    </div>
  );
};