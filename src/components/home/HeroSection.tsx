import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

export const HeroSection = () => {
  const { enableDemo } = useDemo();

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 pointer-events-none" />
      <div className="container mx-auto px-4 pt-32 pb-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 
            className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in"
          >
            Hospitality Desk
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
            Transform your online reputation with intelligent review management and AI-powered responses
          </p>
          <div className="flex justify-center gap-4 pt-4 animate-fade-in [animation-delay:400ms]">
            <Button 
              size="lg" 
              className="group transition-all duration-300 hover:scale-105"
            >
              Get Started 
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="transition-all duration-300 hover:scale-105"
              onClick={enableDemo}
            >
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};