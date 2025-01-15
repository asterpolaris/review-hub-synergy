import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  googleAuthToken: {
    access_token: string;
    expires_at: string;
  } | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  googleAuthToken: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleAuthToken, setGoogleAuthToken] = useState<{
    access_token: string;
    expires_at: string;
  } | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setIsLoading(false);

      if (session) {
        // Fetch Google auth token when session exists
        const { data: tokens } = await supabase
          .from("google_auth_tokens")
          .select("access_token, expires_at")
          .eq("user_id", session.user.id)
          .single();

        setGoogleAuthToken(tokens);
      } else {
        setGoogleAuthToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, googleAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}