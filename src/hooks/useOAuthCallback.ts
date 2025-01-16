import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OAuthCallbackState {
  error: string | null;
  details: string | null;
}

interface TokenExchangeResponse {
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  error: null | {
    message: string;
  };
}

export const useOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<OAuthCallbackState>({
    error: null,
    details: null,
  });

  const handleCallback = async () => {
    console.log("Starting callback handling");
    
    try {
      // First check for any error parameters
      const oauthError = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      
      if (oauthError) {
        console.error("OAuth error:", oauthError, errorDescription);
        throw new Error(errorDescription || oauthError);
      }

      // Get the session from the URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(sessionError.message);
      }

      if (!session) {
        console.error("No session found");
        throw new Error("Authentication failed - no session found");
      }

      console.log("User ID from session:", session.user.id);

      // Extract tokens from provider token
      if (!session.provider_token) {
        throw new Error("No provider token received");
      }

      // Update tokens in the database using upsert
      const { error: upsertError } = await supabase
        .from("google_auth_tokens")
        .upsert(
          {
            user_id: session.user.id,
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token || '',
            expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (upsertError) {
        console.error("Error storing tokens:", upsertError);
        throw new Error("Failed to store authentication tokens");
      }

      console.log("Token storage successful");
      
      toast({
        title: "Successfully connected with Google",
        description: "You can now manage your business reviews",
      });

      navigate("/businesses");
    } catch (error: any) {
      console.error("Error during callback:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to authenticate with Google";
      setState({ 
        error: errorMessage, 
        details: error.response ? JSON.stringify(error.response.data, null, 2) : null 
      });
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    }
  };

  return {
    error: state.error,
    details: state.details,
    handleCallback,
  };
};