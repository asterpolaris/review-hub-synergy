import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { AddBusinessDialog } from "@/components/business/AddBusinessDialog";
import { BusinessList } from "@/components/business/BusinessList";
import { EmailConfigDialog } from "@/components/email/EmailConfigDialog";
import { EmailConfigList } from "@/components/email/EmailConfigList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Businesses = () => {
  const { googleAuthToken } = useAuth();
  const { isConnecting, handleGoogleConnect } = useGoogleAuth();
  const { toast } = useToast();

  const handleGoogleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('google_auth_tokens')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Disconnected from Google Business Profile",
      });

      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting from Google:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Businesses</h1>
          <div className="flex gap-4">
            {googleAuthToken ? (
              <Button 
                onClick={handleGoogleDisconnect} 
                variant="outline"
              >
                Disconnect Google
              </Button>
            ) : (
              <Button 
                onClick={handleGoogleConnect} 
                variant="outline"
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Google Business"}
              </Button>
            )}
            <AddBusinessDialog />
          </div>
        </div>
        <BusinessList />
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Email Configurations</h2>
            <EmailConfigDialog businessId={/* TODO: Add selected business ID */} />
          </div>
          <EmailConfigList businessId={/* TODO: Add selected business ID */} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Businesses;