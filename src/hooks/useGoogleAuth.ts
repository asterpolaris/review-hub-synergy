import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoogleAuthUrlResponse {
  data: {
    url: string;
    debug?: {
      redirectUri: string;
      scopes: string[];
      timestamp: string;
    };
  } | null;
  error: null | {
    message: string;
  };
}

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
      
      const { data, error } = await supabase.functions.invoke<GoogleAuthUrlResponse>("google-auth-url", {
        body: { redirectUrl }
      });
      
      if (error) {
        console.error("Error getting auth URL:", error);
        throw new Error(error.message || "Failed to get authentication URL");
      }

      if (!data?.url) {
        console.error("Invalid response:", data);
        throw new Error("Invalid response from authentication service");
      }

      console.log("Redirecting to Google auth URL...");
      window.location.href = data.url;

    } catch (error: any) {
      console.error("Google connection error:", error);
      setIsConnecting(false);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect with Google Business Profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { isConnecting, handleGoogleConnect };
};