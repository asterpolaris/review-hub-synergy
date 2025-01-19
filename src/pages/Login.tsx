import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

const REDIRECT_URL = `${window.location.origin}/auth/callback`;

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="max-w-md w-full glass-panel">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>
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