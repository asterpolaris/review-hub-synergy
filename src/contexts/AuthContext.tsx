
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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  googleAuthToken: null,
  signOut: async () => {},
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

  const refreshGoogleToken = async (userId: string) => {
    try {
      console.log("[Auth] Starting Google token refresh for user:", userId);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.error("[Auth] No active session found during token refresh");
        return;
      }

      console.log("[Auth] Current session found, checking provider refresh token");
      // Get the provider refresh token from the session
      const providerToken = currentSession.provider_refresh_token;
      if (!providerToken) {
        console.error("[Auth] No refresh token available in session");
        return;
      }

      console.log("[Auth] Calling refresh-google-token edge function");
      // Exchange the refresh token for a new access token
      const response = await supabase.functions.invoke('refresh-google-token', {
        body: { refresh_token: providerToken },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      if (response.error) {
        console.error("[Auth] Edge function error:", response.error);
        throw new Error(response.error.message);
      }

      const { access_token, expires_in } = response.data;
      const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

      console.log("[Auth] Received new token, expires in:", expires_in, "seconds");
      console.log("[Auth] New token expiration:", expires_at);

      // Update the token in the database
      console.log("[Auth] Updating token in database");
      const { error: updateError } = await supabase
        .from('google_auth_tokens')
        .update({
          access_token,
          expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error("[Auth] Database update error:", updateError);
        throw updateError;
      }

      setGoogleAuthToken({ access_token, expires_at });
      console.log("[Auth] Successfully refreshed and stored Google token");

    } catch (error) {
      console.error("[Auth] Failed to refresh Google token:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh Google authentication token",
      });
    }
  };

  const fetchGoogleToken = async (userId: string) => {
    try {
      console.log("[Auth] Fetching Google token for user:", userId);
      
      const { data: tokens, error } = await supabase
        .from("google_auth_tokens")
        .select("access_token, expires_at")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[Auth] Database error fetching Google token:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch Google authentication token",
        });
        setGoogleAuthToken(null);
        return;
      }

      console.log("[Auth] Database response:", tokens);
      
      if (!tokens) {
        console.log("[Auth] No Google token found for user");
        setGoogleAuthToken(null);
        return;
      }

      // Check if token is expired or about to expire (within 5 minutes)
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      console.log("[Auth] Token expires at:", expiresAt);
      console.log("[Auth] Time until expiry:", Math.floor(timeUntilExpiry / 1000), "seconds");

      if (timeUntilExpiry < fiveMinutes) {
        console.log("[Auth] Token expired or about to expire, refreshing...");
        await refreshGoogleToken(userId);
      } else {
        console.log("[Auth] Token is still valid, using existing token");
        setGoogleAuthToken(tokens);
      }
    } catch (error) {
      console.error("[Auth] Failed to fetch Google token:", error);
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
      console.log("[Auth] Initial session check:", session?.user?.id);
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
      console.log("[Auth] Auth state changed:", _event);
      setSession(session);
      setIsLoading(false);

      // Reset Google auth token on sign out
      if (!session) {
        console.log("[Auth] Clearing Google auth token");
        setGoogleAuthToken(null);
      } else {
        // Fetch Google auth token on sign in
        console.log("[Auth] Fetching Google auth token for user:", session.user.id);
        fetchGoogleToken(session.user.id);
      }
    });

    // Set up periodic token refresh check (every 4 minutes)
    console.log("[Auth] Setting up periodic token refresh check (every 4 minutes)");
    const refreshInterval = setInterval(() => {
      if (session?.user) {
        console.log("[Auth] Running periodic token refresh check");
        fetchGoogleToken(session.user.id);
      }
    }, 4 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("[Auth] Signing out user");
      await supabase.auth.signOut();
      console.log("[Auth] Successfully signed out");
    } catch (error) {
      console.error("[Auth] Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, googleAuthToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
