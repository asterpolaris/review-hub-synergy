import React from "react";
import { PricingCard } from "@/components/ui/pricing-card";

interface PricingSectionUIProps {
  title: string;
  subtitle: string;
  frequencies: string[];
  tiers: Array<{
    id: string;
    name: string;
    price: {
      monthly: string | number;
      yearly: string | number;
    };
    description: string;
    features: string[];
    cta: string;
    highlighted?: boolean;
    popular?: boolean;
  }>;
}

export function PricingSection({ title, subtitle, frequencies, tiers }: PricingSectionUIProps) {
  const [selectedFrequency, setSelectedFrequency] = React.useState(frequencies[0]);

  return (
    <section className="w-full py-12 bg-white">
      <div className="container px-4 md:px-6">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-enterprise-gray-900">
            {title}
          </h2>
          <p className="mx-auto max-w-[700px] text-enterprise-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {subtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, index) => (
            <PricingCard
              key={tier.id}
              name={tier.name}
              price={tier.price[selectedFrequency].toString()}
              description={tier.description}
              features={tier.features}
              highlighted={tier.highlighted}
              delay={index * 200}
            />
          ))}
        </div>
      </div>
    </section>
  );
}