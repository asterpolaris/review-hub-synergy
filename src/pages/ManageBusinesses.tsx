import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { AddBusinessDialog } from "@/components/business/AddBusinessDialog";
import { BusinessList } from "@/components/business/BusinessList";

const ManageBusinesses = () => {
  const { googleAuthToken } = useAuth();
  const { isConnecting, handleGoogleConnect } = useGoogleAuth();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Manage Businesses</h1>
          <div className="flex gap-4">
            <Button 
              onClick={handleGoogleConnect} 
              variant="outline"
              disabled={isConnecting}
            >
              {isConnecting 
                ? "Connecting..." 
                : googleAuthToken 
                  ? "Connected to Google" 
                  : "Connect Google Business"
              }
            </Button>
            <AddBusinessDialog />
          </div>
        </div>
        <BusinessList />
      </div>
    </AppLayout>
  );
};

export default ManageBusinesses;