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

  const refreshGoogleToken = async (userId: string) => {
    try {
      console.log("Attempting to refresh Google token for user:", userId);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.error("No active session found during token refresh");
        return;
      }

      // Get the provider refresh token from the session
      const providerToken = currentSession.provider_refresh_token;
      if (!providerToken) {
        console.error("No refresh token available");
        return;
      }

      // Exchange the refresh token for a new access token
      const response = await supabase.functions.invoke('refresh-google-token', {
        body: { refresh_token: providerToken },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { access_token, expires_in } = response.data;
      const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

      // Update the token in the database
      const { error: updateError } = await supabase
        .from('google_auth_tokens')
        .update({
          access_token,
          expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      setGoogleAuthToken({ access_token, expires_at });
      console.log("Successfully refreshed Google token");

    } catch (error) {
      console.error("Failed to refresh Google token:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh Google authentication token",
      });
    }
  };

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

      // Check if token is expired or about to expire (within 5 minutes)
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        console.log("Token expired or about to expire, refreshing...");
        await refreshGoogleToken(userId);
      } else {
        setGoogleAuthToken(tokens);
      }
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

    // Set up periodic token refresh check (every 4 minutes)
    const refreshInterval = setInterval(() => {
      if (session?.user) {
        fetchGoogleToken(session.user.id);
      }
    }, 4 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, googleAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}