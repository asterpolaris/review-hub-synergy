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
      
      // Add event listener for messages from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        console.log("Received message from popup:", event.data);
        
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log("Google authentication successful");
          setIsConnecting(false);
          toast({
            title: "Successfully connected with Google",
            description: "You can now manage your business reviews",
          });
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          console.error("Google authentication error:", event.data.error);
          setIsConnecting(false);
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: event.data.error || "Failed to connect with Google",
          });
        }
      };

      window.addEventListener('message', messageHandler);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true
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

      console.log("Opening popup with URL:", data.url);
      
      const popup = window.open(
        data.url,
        'Google Login',
        'width=600,height=800,scrollbars=yes'
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        throw new Error("Popup was blocked. Please allow popups for this site.");
      }

      // Monitor popup
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          setIsConnecting(false);
          console.log("Auth popup closed");
        }
      }, 500);

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