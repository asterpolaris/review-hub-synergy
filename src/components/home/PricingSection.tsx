import { PAYMENT_FREQUENCIES, TIERS } from "./pricing-data";
import { PricingCard } from "./PricingCard";

export const PricingSection = () => {
  return (
    <div className="container mx-auto px-4 py-24 bg-white">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-enterprise-gray-900">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto max-w-[700px] text-enterprise-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Choose the plan that's right for your business
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier, index) => (
          <PricingCard
            key={tier.id}
            name={tier.name}
            price={tier.price.monthly.toString()}
            description={tier.description}
            features={tier.features}
            highlighted={tier.highlighted}
            delay={index * 200}
          />
        ))}
      </div>
    </div>
  );
};