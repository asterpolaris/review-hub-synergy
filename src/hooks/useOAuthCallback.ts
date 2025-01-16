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
  } | null;
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
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    
    if (!code) {
      console.error("No authorization code received");
      setState({ error: "No authorization code received", details: null });
      return;
    }

    console.log("Received authorization code:", code);
    console.log("Received state:", stateParam);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      console.log("Calling exchange-token function...");
      const { data, error } = await supabase.functions.invoke<TokenExchangeResponse>("exchange-token", {
        body: { code }
      });

      if (error) {
        console.error("Token exchange error:", error);
        throw new Error(error.message || "Failed to exchange token");
      }

      if (!data) {
        console.error("No data received from token exchange");
        throw new Error("No response data from token exchange");
      }

      // Store tokens in the database
      const { error: insertError } = await supabase
        .from("google_auth_tokens")
        .upsert({
          user_id: user.id,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        });

      if (insertError) {
        console.error("Error storing tokens:", insertError);
        throw new Error("Failed to store authentication tokens");
      }

      console.log("Token exchange successful");
      
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
        description: "Failed to complete Google authentication. Please try again.",
      });
    }
  };

  return {
    error: state.error,
    details: state.details,
    handleCallback,
  };
};