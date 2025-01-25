import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PendingRegistration {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AdminRegistrations = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (registration: PendingRegistration) => {
    try {
      const { data, error } = await supabase
        .rpc('approve_registration', {
          registration_id: registration.id,
          admin_id: session?.user.id
        });

      if (error) throw error;

      await supabase.functions.invoke('send-registration-email', {
        body: {
          type: 'user_approved',
          email: registration.email,
          registrationId: registration.id
        }
      });

      toast({
        title: "Success",
        description: "Registration approved successfully",
      });

      loadRegistrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (registration: PendingRegistration) => {
    try {
      const { error } = await supabase
        .rpc('reject_registration', {
          registration_id: registration.id,
          admin_id: session?.user.id
        });

      if (error) throw error;

      await supabase.functions.invoke('send-registration-email', {
        body: {
          type: 'user_rejected',
          email: registration.email,
          registrationId: registration.id
        }
      });

      toast({
        title: "Success",
        description: "Registration rejected successfully",
      });

      loadRegistrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Pending Registrations</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>{registration.email}</TableCell>
              <TableCell>
                {registration.first_name} {registration.last_name}
              </TableCell>
              <TableCell>
                {new Date(registration.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>{registration.status}</TableCell>
              <TableCell className="space-x-2">
                {registration.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(registration)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(registration)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminRegistrations;