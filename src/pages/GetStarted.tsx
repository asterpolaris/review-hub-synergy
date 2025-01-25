import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const GetStarted = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    company: "",
    locations: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create pending registration
      const { error: registrationError } = await supabase
        .from('pending_registrations')
        .insert({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          password_hash: formData.password, // The server will hash this when approving
        });

      if (registrationError) throw registrationError;

      // Notify admin
      await supabase.functions.invoke('send-registration-email', {
        body: {
          type: 'admin_notification',
          email: 'juan@asterpolaris.com',
        }
      });

      toast({
        title: "Registration Submitted",
        description: "Your registration is pending approval. We'll notify you once it's reviewed.",
      });
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="max-w-2xl w-full glass-panel">
        <CardContent className="pt-6">
          <h1 className="text-3xl font-bold text-center mb-2">Get Started with Hospitality Desk</h1>
          <p className="text-center text-muted-foreground mb-8">
            Fill out the form below to request an account. We'll review your application and get back to you shortly.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input 
                id="company"
                value={formData.company}
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locations">Number of Business Locations</Label>
              <Input 
                id="locations" 
                type="number" 
                min="1"
                value={formData.locations}
                onChange={handleInputChange}
                required 
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default GetStarted;