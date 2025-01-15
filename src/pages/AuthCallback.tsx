import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);

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

      console.log("Received authorization code:", code);
      console.log("Received state:", state);
      
      try {
        const stateData = state ? JSON.parse(decodeURIComponent(state)) : null;
        const returnTo = stateData?.returnTo || "/";

        console.log("Calling exchange-token function...");
        const { data, error: functionError } = await supabase.functions.invoke("exchange-token", {
          body: { code },
        });

        console.log("Function response:", { data, error: functionError });

        if (functionError) {
          console.error("Token exchange error:", functionError);
          throw new Error(functionError.message || "Failed to exchange token");
        }

        if (!data) {
          console.error("No data received from token exchange");
          throw new Error("No response data from token exchange");
        }

        console.log("Token exchange successful:", data);
        
        toast({
          title: "Successfully connected with Google",
          description: "You can now manage your business reviews",
        });

        navigate(returnTo);
      } catch (err) {
        console.error("Error during callback:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to authenticate with Google";
        console.error("Formatted error message:", errorMessage);
        setError(errorMessage);
        if (err.response) {
          setDetails(JSON.stringify(err.response.data, null, 2));
        }
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to complete Google authentication. Please try again.",
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p className="font-medium">{error}</p>
                {details && (
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                    {details}
                  </pre>
                )}
              </div>
            </AlertDescription>
          </Alert>
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