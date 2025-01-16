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

  const fetchGoogleToken = async (userId: string) => {
    const { data: tokens } = await supabase
      .from("google_auth_tokens")
      .select("access_token, expires_at")
      .eq("user_id", userId)
      .single();

    setGoogleAuthToken(tokens);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchGoogleToken(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event);
      setSession(session);
      setIsLoading(false);

      // Reset Google auth token on sign out
      if (!session) {
        console.log("Clearing Google auth token");
        setGoogleAuthToken(null);
      } else {
        // Fetch Google auth token on sign in
        console.log("Fetching Google auth token for user:", session.user.id);
        fetchGoogleToken(session.user.id);
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