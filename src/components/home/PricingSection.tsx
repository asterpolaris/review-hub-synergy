import { PricingCard } from "./PricingCard";

const pricingTiers = [
  {
    name: "Standard",
    price: "25",
    description: "Perfect for small businesses getting started with review management",
    features: [
      "Multi-business review management",
      "Review response capabilities",
      "Basic analytics dashboard",
      "Email support",
      "Up to 5 business locations",
    ],
  },
  {
    name: "Premium",
    price: "50",
    description: "Advanced features for businesses seeking growth and efficiency",
    features: [
      "Everything in Standard",
      "AI-powered review responses",
      "Advanced analytics",
      "Priority support",
      "Unlimited business locations",
      "Custom response templates",
    ],
    highlighted: true,
  },
];

export const PricingSection = () => {
  return (
    <div className="container mx-auto px-4 py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20 pointer-events-none" />
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Simple, transparent pricing</h2>
        <p className="text-muted-foreground">Choose the plan that's right for your business</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto relative">
        {pricingTiers.map((tier, index) => (
          <PricingCard
            key={tier.name}
            {...tier}
            delay={index * 200}
          />
        ))}
      </div>
    </div>
  );
};