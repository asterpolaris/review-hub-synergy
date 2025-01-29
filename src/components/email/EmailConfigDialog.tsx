import { useState } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmailConfigurations } from "@/hooks/useEmailConfigurations";

interface EmailConfigDialogProps {
  businessId: string;
}

export const EmailConfigDialog = ({ businessId }: EmailConfigDialogProps) => {
  const [open, setOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    email_address: "",
    type: "",
  });

  const { addConfiguration } = useEmailConfigurations(businessId);

  const handleAddConfig = async () => {
    if (!newConfig.email_address || !newConfig.type) {
      return;
    }

    await addConfiguration.mutateAsync({
      business_id: businessId,
      email_address: newConfig.email_address,
      type: newConfig.type,
    });

    setNewConfig({ email_address: "", type: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Email Configuration
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Email Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={newConfig.email_address}
              onChange={(e) =>
                setNewConfig({ ...newConfig, email_address: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={newConfig.type}
              onValueChange={(value) =>
                setNewConfig({ ...newConfig, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddConfig} className="w-full">
            Add Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};