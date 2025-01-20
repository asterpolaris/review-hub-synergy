import { Building2, MessageCircle, Star } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    Icon: Building2,
    title: "Multi-Business Management",
    description: "Manage reviews across all your business locations from one dashboard",
  },
  {
    Icon: MessageCircle,
    title: "Quick Responses",
    description: "Respond to customer reviews efficiently with our streamlined interface",
  },
  {
    Icon: Star,
    title: "Review Monitoring",
    description: "Track and analyze your review metrics with detailed insights",
  },
];

export const FeaturesSection = () => {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Everything you need to manage reviews</h2>
        <p className="text-muted-foreground">Streamline your review management process with powerful tools</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            {...feature}
            delay={index * 200}
          />
        ))}
      </div>
    </div>
  );
};