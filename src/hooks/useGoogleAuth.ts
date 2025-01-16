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
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 10000);
      });

      const authUrlPromise = supabase.functions.invoke("google-auth-url", {
        body: { redirectUrl }
      });

      // Race between the timeout and the actual request
      const { data, error } = await Promise.race([authUrlPromise, timeoutPromise]);
      
      if (error) {
        console.error("Error getting auth URL:", error);
        throw new Error(error.message || "Failed to get authentication URL");
      }

      if (!data?.url) {
        console.error("Invalid response:", data);
        throw new Error("Invalid response from authentication service");
      }

      console.log("Redirecting to Google auth URL...");
      // Add a small delay before redirect to ensure state is updated
      setTimeout(() => {
        window.location.href = data.url;
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