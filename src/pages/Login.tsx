import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { AuthError } from "@/components/auth/AuthError";
import { useToast } from "@/hooks/use-toast";

const REDIRECT_URL = `${window.location.origin}/auth/callback`;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;

      if (event === 'SIGNED_IN') {
        navigate("/dashboard");
      } else if (event === 'USER_UPDATED') {
        try {
          const { error } = await supabase.auth.getSession();
          if (error && isSubscribed) {
            setAuthError(error.message);
            toast({
              title: "Authentication Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } catch (error: any) {
          if (isSubscribed) {
            const errorMessage = error?.message || "An error occurred during authentication";
            setAuthError(errorMessage);
            toast({
              title: "Authentication Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthError(null);
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="max-w-md w-full glass-panel">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>
          {authError && <AuthError error={authError} />}
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
            redirectTo={REDIRECT_URL}
            onlyThirdPartyProviders={false}
          />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            {" • "}
            <Link to="/terms" className="hover:underline">
              Terms of Service
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;