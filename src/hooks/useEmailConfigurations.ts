import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { EmailConfiguration } from '@/types/email';

export function useEmailConfigurations(businessId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: configurations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['emailConfigurations', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      
      const { data, error } = await supabase
        .from('email_configurations')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailConfiguration[];
    },
    enabled: !!businessId,
  });

  const addConfiguration = useMutation({
    mutationFn: async (newConfig: Partial<EmailConfiguration>) => {
      const { error } = await supabase
        .from('email_configurations')
        .insert(newConfig);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailConfigurations', businessId] });
      toast({
        title: "Success",
        description: "Email configuration added successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding email configuration:', error);
      toast({
        title: "Error",
        description: "Failed to add email configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleConfiguration = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('email_configurations')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailConfigurations', businessId] });
      toast({
        title: "Success",
        description: "Email configuration updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating email configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update email configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteConfiguration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailConfigurations', businessId] });
      toast({
        title: "Success",
        description: "Email configuration deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting email configuration:', error);
      toast({
        title: "Error",
        description: "Failed to delete email configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    configurations,
    isLoading,
    error,
    addConfiguration,
    toggleConfiguration,
    deleteConfiguration,
  };
}