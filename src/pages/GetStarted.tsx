import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const GetStarted = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Here you would typically send this data to your backend
    // For now we'll just show a success message
    toast({
      title: "Thank you for your interest!",
      description: "We'll be in touch with you shortly.",
    });
    
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="max-w-2xl w-full glass-panel">
        <CardContent className="pt-6">
          <h1 className="text-3xl font-bold text-center mb-2">Get Started with Hospitality Desk</h1>
          <p className="text-center text-muted-foreground mb-8">
            Fill out the form below and we'll help you get started with managing your business reviews.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input id="email" type="email" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locations">Number of Business Locations</Label>
              <Input id="locations" type="number" min="1" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Tell us about your review management needs</Label>
              <Textarea 
                id="message" 
                placeholder="What challenges are you facing with managing reviews?" 
                className="min-h-[100px]"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GetStarted;