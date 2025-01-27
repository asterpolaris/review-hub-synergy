import { PAYMENT_FREQUENCIES, TIERS } from "./pricing-data";
import { PricingSection as PricingSectionUI } from "@/components/ui/pricing-section";

export const PricingSection = () => {
  return (
    <div className="container mx-auto px-4 py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20 pointer-events-none" />
      <PricingSectionUI
        title="Simple, transparent pricing"
        subtitle="Choose the plan that's right for your business"
        frequencies={PAYMENT_FREQUENCIES}
        tiers={TIERS}
      />
    </div>
  );
};