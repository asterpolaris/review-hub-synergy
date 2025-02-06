import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const AddBusinessDialog = () => {
  const [newBusiness, setNewBusiness] = useState({ name: "", location: "" });
  const { toast } = useToast();
  const { session } = useAuth();

  const handleAddBusiness = async () => {
    if (!newBusiness.name || !newBusiness.location) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a business",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("businesses").insert({
      name: newBusiness.name,
      location: newBusiness.location,
      user_id: session.user.id,
    });

    if (error) {
      console.error("Error adding business:", error);
      toast({
        title: "Error",
        description: "Failed to add business",
        variant: "destructive",
      });
      return;
    }

    setNewBusiness({ name: "", location: "" });
    toast({
      title: "Success",
      description: "Business added successfully",
    });
  };

  return null; // Component no longer renders anything since we're using Google integration
};