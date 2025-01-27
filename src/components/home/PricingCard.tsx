import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  delay?: number;
}

export const PricingCard = ({
  name,
  price,
  description,
  features,
  highlighted = false,
  delay = 0,
}: PricingCardProps) => {
  return (
    <div
      className={`p-8 rounded-2xl glass-panel animate-fade-in hover:scale-105 transition-all duration-300 ${
        highlighted
          ? "border-primary shadow-lg scale-105 relative z-10"
          : "border-border"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2 text-foreground">{name}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="text-4xl font-bold mb-2 text-foreground">
          {price === "Free" ? price : `$${price}`}
          <span className="text-lg text-muted-foreground">/month</span>
        </div>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Button 
        className={`w-full transition-all duration-300 hover:scale-105 ${
          highlighted ? "" : "hover:bg-primary"
        }`} 
        variant={highlighted ? "default" : "outline"}
      >
        Get Started
      </Button>
    </div>
  );
};