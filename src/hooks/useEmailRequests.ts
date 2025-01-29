import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EmailRequest, EmailRequestStatus } from '@/types/email';
import { useToast } from '@/hooks/use-toast';

export function useEmailRequests(businessId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: emailRequests,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['emailRequests', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      
      const { data, error } = await supabase
        .from('email_requests')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailRequest[];
    },
    enabled: !!businessId,
  });

  const updateEmailStatus = useMutation({
    mutationFn: async ({ 
      requestId, 
      status 
    }: { 
      requestId: string; 
      status: EmailRequestStatus 
    }) => {
      const { error } = await supabase
        .from('email_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailRequests', businessId] });
      toast({
        title: "Status updated",
        description: "The email request status has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating email status:', error);
      toast({
        title: "Error",
        description: "Failed to update the email request status. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    emailRequests,
    isLoading,
    error,
    updateEmailStatus,
  };
}