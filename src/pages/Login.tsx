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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-100 via-violet-50 to-white p-4">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Logo or branding */}
      <div className="mb-8 relative">
        <h1 className="text-3xl font-bold text-slate-900">Hospitality Desk</h1>
        <p className="text-slate-600 mt-2">Welcome back! Please sign in to continue.</p>
      </div>

      <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl relative">
        <CardContent className="pt-6">
          {authError && <AuthError error={authError} />}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(139, 92, 246)',
                    brandAccent: 'rgb(124, 58, 237)',
                    brandButtonText: 'white',
                    defaultButtonBackground: 'white',
                    defaultButtonBackgroundHover: 'rgb(243, 244, 246)',
                    inputBackground: 'white',
                    inputBorder: 'rgb(229, 231, 235)',
                    inputBorderHover: 'rgb(139, 92, 246)',
                    inputBorderFocus: 'rgb(139, 92, 246)',
                  },
                  space: {
                    buttonPadding: '0.75rem 1rem',
                    inputPadding: '0.75rem 1rem',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                  fonts: {
                    bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
                    buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
                  },
                },
              },
              className: {
                container: 'space-y-4',
                button: 'transition-colors duration-200',
                label: 'text-sm font-medium text-slate-700',
                input: 'transition-colors duration-200',
                divider: 'my-4',
                message: 'text-sm text-slate-600',
              },
            }}
            theme="light"
            providers={[]}
            redirectTo={REDIRECT_URL}
            onlyThirdPartyProviders={false}
          />
          <div className="mt-6 text-center text-sm text-slate-600 space-x-3">
            <Link to="/privacy-policy" className="hover:text-violet-600 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-violet-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;