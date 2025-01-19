import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MessageCircle, Star, Sparkles, ArrowRight } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 pointer-events-none" />
        <div className="container mx-auto px-4 pt-32 pb-24">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in">
              Hospitality Desk
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in [animation-delay:200ms]">
              Transform your online reputation with intelligent review management and AI-powered responses
            </p>
            <div className="flex justify-center gap-4 pt-4 animate-fade-in [animation-delay:400ms]">
              <Button size="lg" className="group">
                Get Started <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to manage reviews</h2>
          <p className="text-muted-foreground">Streamline your review management process with powerful tools</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="p-8 rounded-2xl glass-panel hover:scale-105 transition-transform duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <feature.icon className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20 pointer-events-none" />
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground">Choose the plan that's right for your business</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto relative">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`p-8 rounded-2xl glass-panel animate-fade-in ${
                tier.highlighted
                  ? "border-primary shadow-lg scale-105 relative z-10"
                  : "border-border"
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-muted-foreground mb-4">{tier.description}</p>
                <div className="text-4xl font-bold mb-2">
                  ${tier.price}
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant={tier.highlighted ? "default" : "outline"}>
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Section */}
      <div className="container mx-auto px-4 py-24">
        <Card className="max-w-md mx-auto glass-panel">
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
