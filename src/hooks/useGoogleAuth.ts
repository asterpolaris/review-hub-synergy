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
      
      // Open popup with specific features to minimize COOP issues
      const popup = window.open(
        data.url,
        'Google Login',
        'width=600,height=800,scrollbars=yes,status=1,toolbar=0,location=1,menubar=0'
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        throw new Error("Popup was blocked. Please allow popups for this site.");
      }

      // Use a more reliable method to check popup state
      const checkPopup = setInterval(() => {
        try {
          // First check if popup exists and is not closed
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            setIsConnecting(false);
            console.log("Auth popup closed");
            return;
          }

          // Try to access location carefully
          const currentUrl = popup.location.href;
          if (currentUrl.includes('/auth/callback')) {
            popup.postMessage({ type: 'CHECK_AUTH_STATUS' }, window.location.origin);
          }
        } catch (e) {
          // Ignore cross-origin errors - this is expected
          if (!(e instanceof DOMException)) {
            console.error("Popup check error:", e);
          }
        }
      }, 500);

      // Set a timeout to clean up if authentication takes too long
      setTimeout(() => {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
        setIsConnecting(false);
        if (popup && !popup.closed) {
          popup.close();
        }
        toast({
          variant: "destructive",
          title: "Connection Timeout",
          description: "The authentication process took too long. Please try again.",
        });
      }, 300000); // 5 minute timeout

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