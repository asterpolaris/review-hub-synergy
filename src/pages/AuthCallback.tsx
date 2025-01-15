import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log("Starting callback handling");
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      
      if (!code) {
        console.error("No authorization code received");
        setError("No authorization code received");
        return;
      }

      console.log("Received authorization code");
      
      try {
        // Parse the state parameter to get the return URL
        const stateData = state ? JSON.parse(decodeURIComponent(state)) : null;
        const returnTo = stateData?.returnTo || "/";

        console.log("Calling exchange-token function");
        
        // Call the exchange-token function
        const { data, error } = await supabase.functions.invoke("exchange-token", {
          body: { code }
        });

        if (error) {
          console.error("Token exchange error:", error);
          throw error;
        }

        console.log("Token exchange response:", data);
        
        // Show success message
        toast({
          title: "Successfully connected with Google",
          description: "You can now manage your business reviews",
        });

        // Redirect back to the main application
        console.log("Redirecting to:", returnTo);
        navigate(returnTo);
      } catch (err) {
        console.error("Error during callback:", err);
        setError(err instanceof Error ? err.message : "Failed to authenticate with Google");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to complete Google authentication. Please try again.",
        });
        navigate("/");
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Completing Authentication...</h1>
        <p className="mt-2 text-gray-600">Please wait while we process your login.</p>
      </div>
    </div>
  );
};

export default AuthCallback;