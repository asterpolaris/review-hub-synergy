import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MessageCircle, Star, Sparkles } from "lucide-react";

// Use window.location.origin to dynamically get the current domain
const REDIRECT_URL = `${window.location.origin}/auth/callback`;

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const features = [
    {
      icon: Building2,
      title: "Multi-Business Management",
      description: "Manage reviews across all your business locations from one dashboard",
    },
    {
      icon: MessageCircle,
      title: "Quick Responses",
      description: "Respond to customer reviews efficiently with our streamlined interface",
    },
    {
      icon: Star,
      title: "Review Monitoring",
      description: "Track and analyze your review metrics with detailed insights",
    },
  ];

  const pricingTiers = [
    {
      name: "Standard",
      price: "25",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Hospitality Desk
          </h1>
          <p className="text-xl text-muted-foreground">
            Streamline your Google Reviews management and boost your online reputation
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 rounded-lg border ${
                tier.highlighted
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-4xl font-bold">
                  ${tier.price}
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'rgb(var(--primary))',
                      brandAccent: 'rgb(var(--primary))',
                    },
                  },
                },
              }}
              theme="light"
              providers={[]}
              redirectTo={REDIRECT_URL}
              onlyThirdPartyProviders={false}
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <a href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </a>
              {" • "}
              <a href="/terms" className="hover:underline">
                Terms of Service
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;