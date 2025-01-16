import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useGoogleAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleGoogleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log("Starting Google connection process...");
      
      // Use window.location.origin to dynamically get the current domain
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log("Using redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.functions.invoke("google-auth-url", {
        body: { redirectUrl }
      });
      
      if (error) {
        console.error("Error getting auth URL:", error);
        toast({
          title: "Connection Error",
          description: "Failed to initiate Google connection. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        console.log("Redirecting to Google auth URL...");
        window.location.href = data.url;
      } else {
        console.error("Invalid response:", data);
        toast({
          title: "Error",
          description: "Invalid response from authentication service",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Google connection error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect with Google Business Profile. Please ensure you have been granted API access.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return { isConnecting, handleGoogleConnect };
};