import { PAYMENT_FREQUENCIES, TIERS } from "./pricing-data";
import { PricingSection as PricingSectionUI } from "@/components/ui/pricing-section";

interface PricingSectionProps {
  title: string;
  subtitle: string;
  frequencies: string[];
  tiers: typeof TIERS;
}

export const PricingSection = ({ 
  title, 
  subtitle, 
  frequencies, 
  tiers 
}: PricingSectionProps) => {
  return (
    <div className="container mx-auto px-4 py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20 pointer-events-none" />
      <PricingSectionUI
        title={title}
        subtitle={subtitle}
        frequencies={frequencies}
        tiers={tiers}
      />
    </div>
  );
};