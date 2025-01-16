import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Use window.location.origin to dynamically get the current domain
const REDIRECT_URL = `${window.location.origin}/auth/callback`;

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Index page mounted");
    console.log("Redirect URL configured as:", REDIRECT_URL);
    
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">JEGantic Hospitality Desk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            providers={[]}
            view="sign_in"
            showLinks={true}
            redirectTo={REDIRECT_URL}
            socialLayout="horizontal"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in ...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                },
              },
            }}
          />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
            {' • '}
            <a href="/terms" className="hover:underline">Terms of Service</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;