import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Upload, User } from "lucide-react";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  avatar?: FileList;
}

export function ProfileSettings() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileFormData>();

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        
        if (profile) {
          reset({
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      }
    }
    
    loadProfile();
  }, [session?.user, reset, toast]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!session?.user) return;
    
    setIsLoading(true);
    try {
      let avatarUrl = null;
      
      if (data.avatar?.[0]) {
        const file = data.avatar[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        avatarUrl = publicUrl;
      }
      
      // Update both profile and user metadata
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        })
        .eq('id', session.user.id);
        
      if (profileError) throw profileError;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        }
      });

      if (updateError) throw updateError;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={session?.user?.user_metadata?.avatar_url} />
          <AvatarFallback>
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">Profile Settings</h3>
          <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="Enter your last name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">Profile Photo</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            {...register("avatar")}
            className="cursor-pointer"
          />
        </div>

        <Button type="submit" disabled={isLoading || !isDirty} className="w-full">
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </form>

      <div className="pt-4">
        <Button
          variant="outline"
          className="w-full group relative"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
          <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </span>
        </Button>
      </div>
    </div>
  );
}