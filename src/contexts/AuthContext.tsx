import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const fetchGoogleToken = async (userId: string) => {
    try {
      console.log("Fetching Google token for user:", userId);
      
      const { data: tokens, error } = await supabase
        .from("google_auth_tokens")
        .select("access_token, expires_at")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Database error fetching Google token:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch Google authentication token",
        });
        setGoogleAuthToken(null);
        return;
      }

      console.log("Received tokens:", tokens);
      
      if (!tokens) {
        console.log("No Google token found for user");
        setGoogleAuthToken(null);
        return;
      }

      setGoogleAuthToken(tokens);
    } catch (error) {
      console.error("Failed to fetch Google token:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while fetching Google token",
      });
      setGoogleAuthToken(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.id);
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