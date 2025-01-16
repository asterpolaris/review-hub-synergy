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
  };
  error: null;
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
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 10000);
      });

      const authUrlPromise = supabase.functions.invoke<GoogleAuthUrlResponse>("google-auth-url", {
        body: { redirectUrl }
      });

      // Race between the timeout and the actual request
      const response = await Promise.race([authUrlPromise, timeoutPromise]);
      
      if (response.error) {
        console.error("Error getting auth URL:", response.error);
        throw new Error(response.error.message || "Failed to get authentication URL");
      }

      if (!response.data?.url) {
        console.error("Invalid response:", response.data);
        throw new Error("Invalid response from authentication service");
      }

      console.log("Redirecting to Google auth URL...");
      // Add a small delay before redirect to ensure state is updated
      setTimeout(() => {
        window.location.href = response.data.url;
      }, 100);

    } catch (error) {
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