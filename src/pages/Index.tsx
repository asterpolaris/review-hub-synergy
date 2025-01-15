import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRODUCTION_URL = 'https://review-hub-synergy.lovable.app';

const Index = () => {
  const navigate = useNavigate();

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
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">JEGantic Hospitality Desk</CardTitle>
        </CardHeader>
        <CardContent>
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
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;