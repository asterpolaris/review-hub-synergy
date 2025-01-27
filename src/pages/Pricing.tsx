import { Navigation } from "@/components/layout/Navigation";
import { PricingSection } from "@/components/home/PricingSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PAYMENT_FREQUENCIES, TIERS } from "@/components/home/pricing-data";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#1A1F2C]">
      <Navigation />
      
      <main className="pt-24">
        {/* Hero Section */}
        <div className="container mx-auto px-4 text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your business. Whether you're just starting out
            or managing multiple locations, we've got you covered.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/get-started">Get Started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">Book a Demo</Link>
            </Button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20 pointer-events-none" />
          <PricingSection
            title="Simple, transparent pricing"
            subtitle="Choose the plan that's right for your business"
            frequencies={PAYMENT_FREQUENCIES}
            tiers={TIERS}
          />
        </div>

        {/* FAQ Section */}
        <div className="container mx-auto px-4 py-24">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-enterprise-charcoal p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">
                Can I switch plans later?
              </h3>
              <p className="text-gray-300">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div className="bg-enterprise-charcoal p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">
                Is there a free trial?
              </h3>
              <p className="text-gray-300">
                Yes, all paid plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div className="bg-enterprise-charcoal p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-300">
                We accept all major credit cards and can arrange alternative payment methods for Enterprise plans.
              </p>
            </div>
            <div className="bg-enterprise-charcoal p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">
                Do you offer custom solutions?
              </h3>
              <p className="text-gray-300">
                Yes, our Enterprise plan can be customized to meet your specific needs. Contact us to learn more.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Review Management?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using Hospitality Desk to improve their online presence.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/get-started">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}