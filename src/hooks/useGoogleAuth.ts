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
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/businessprofileperformance',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error("Google auth error:", error);
        throw new Error(error.message || "Failed to connect with Google");
      }

      if (!data?.url) {
        console.error("Invalid response:", data);
        throw new Error("Invalid response from authentication service");
      }

      console.log("Redirecting to URL:", data.url);
      window.location.href = data.url;

    } catch (error: any) {
      console.error("Google connection error:", error);
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error.message || "Failed to connect with Google Business Profile. Please try again.",
      });
    }
  };

  return { isConnecting, handleGoogleConnect };
};