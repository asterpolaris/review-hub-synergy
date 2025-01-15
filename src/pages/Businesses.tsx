import { useState } from "react";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
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

const Businesses = () => {
  const [businesses, setBusinesses] = useState<Array<{ id: number; name: string; location: string }>>([]);
  const [newBusiness, setNewBusiness] = useState({ name: "", location: "" });
  const { toast } = useToast();

  const handleAddBusiness = () => {
    if (!newBusiness.name || !newBusiness.location) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setBusinesses([
      ...businesses,
      { id: Date.now(), name: newBusiness.name, location: newBusiness.location },
    ]);
    setNewBusiness({ name: "", location: "" });
    toast({
      title: "Success",
      description: "Business added successfully",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Businesses</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Business
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Business</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={newBusiness.name}
                    onChange={(e) =>
                      setNewBusiness({ ...newBusiness, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newBusiness.location}
                    onChange={(e) =>
                      setNewBusiness({ ...newBusiness, location: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleAddBusiness} className="w-full">
                  Add Business
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="glass-panel rounded-lg p-6 space-y-2"
            >
              <h3 className="text-xl font-semibold">{business.name}</h3>
              <p className="text-muted-foreground">{business.location}</p>
            </div>
          ))}
          {businesses.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No businesses added yet. Click the button above to add your first
              business.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Businesses;