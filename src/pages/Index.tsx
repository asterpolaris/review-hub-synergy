import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const PRODUCTION_URL = 'https://review-hub-synergy.lovable.app';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Index page mounted");
    console.log("Current redirect URL:", `${PRODUCTION_URL}/auth/callback`);
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      if (session) {
        console.log("Session found, navigating to dashboard");
        navigate("/dashboard");
      }
      if (event === 'SIGNED_OUT') {
        setAuthError(null);
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${PRODUCTION_URL}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        }
      });

      if (error) {
        console.error("Google sign-in error:", error);
        setAuthError(error.message);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message,
        });
      }
    } catch (err) {
      console.error("Unexpected error during sign-in:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setAuthError(errorMessage);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">JEGantic Hospitality Desk</CardTitle>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(var(--primary))',
                    brandAccent: 'rgb(var(--primary))',
                  },
                },
              },
            }}
            theme="light"
            providers={["google"]}
            onlyThirdPartyProviders={true}
            redirectTo={`${PRODUCTION_URL}/auth/callback`}
            view="sign_in"
            showLinks={false}
            onError={(error) => {
              console.error("Auth UI error:", error);
              setAuthError(error.message);
              toast({
                variant: "destructive",
                title: "Authentication Error",
                description: error.message,
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;