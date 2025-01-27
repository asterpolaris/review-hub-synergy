import React from "react";
import { PricingCard } from "./pricing-card";

export function PricingSection() {
  return (
    <section className="w-full py-12 bg-white">
      <div className="container px-4 md:px-6">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-enterprise-gray-900">Simple, transparent pricing</h2>
          <p className="mx-auto max-w-[700px] text-enterprise-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Choose the plan that's right for you
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
          <PricingCard
            title="Free"
            price="$0"
            description="Perfect for individuals and small businesses"
            features={[
              "1 business location",
              "Basic review management",
              "Standard response templates",
              "Community support"
            ]}
            buttonText="Get Started"
            buttonVariant="outline"
          />
          <PricingCard
            title="Pro"
            price="$49"
            description="Ideal for growing businesses"
            features={[
              "Up to 5 business locations",
              "Advanced review analytics",
              "Custom response templates",
              "Priority email support",
              "AI-powered responses"
            ]}
            buttonText="Start Free Trial"
            buttonVariant="default"
            popular
          />
          <PricingCard
            title="Enterprise"
            price="Contact us"
            description="For large organizations"
            features={[
              "Unlimited business locations",
              "Custom analytics dashboard",
              "Dedicated account manager",
              "24/7 phone support",
              "Custom AI training",
              "API access"
            ]}
            buttonText="Contact Sales"
            buttonVariant="outline"
          />
        </div>
      </div>
    </section>
  );
}