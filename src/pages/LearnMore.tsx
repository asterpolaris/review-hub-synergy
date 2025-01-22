import { Navigation } from "@/components/layout/Navigation";
import { LearnMoreSection } from "@/components/learn-more/LearnMoreSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LearnMore = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGetStarted = () => {
    navigate("/get-started");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      <div className="container mx-auto px-4 pt-32 pb-12">
        <div className="text-center space-y-6 mb-16 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Discover Hospitality Desk Features
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage and improve your restaurant's online presence
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="group"
          >
            Get Started Now
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <ScrollArea className="h-full">
          <div className="space-y-32 pb-24">
            <LearnMoreSection
              title="Review Management"
              description="Efficiently manage and respond to customer reviews across all your venues"
              features={[
                "Centralized dashboard for all reviews",
                "Smart filtering by rating, date, and response status",
                "Batch review management",
                "Real-time review notifications"
              ]}
              icon="MessageSquare"
              imageUrl="/placeholder.svg"
              delay={0}
              imagePosition="right"
            />
            <LearnMoreSection
              title="AI-Powered Responses"
              description="Generate contextual, personalized responses to reviews using advanced AI"
              features={[
                "Intelligent response generation",
                "Customizable response templates",
                "Sentiment analysis",
                "Brand voice consistency"
              ]}
              icon="Brain"
              imageUrl="/placeholder.svg"
              delay={200}
              imagePosition="left"
            />

            <LearnMoreSection
              title="Business Analytics"
              description="Track and analyze your review performance metrics"
              features={[
                "Review trend analysis",
                "Rating distribution charts",
                "Response rate tracking",
                "Comparative venue analytics"
              ]}
              icon="BarChart2"
              imageUrl="/placeholder.svg"
              delay={400}
              imagePosition="right"
            />

            <LearnMoreSection
              title="Multi-Location Management"
              description="Seamlessly manage multiple venues from a single dashboard"
              features={[
                "Individual venue profiles",
                "Location-specific analytics",
                "Customizable venue settings",
                "Hierarchical access control"
              ]}
              icon="Store"
              imageUrl="/placeholder.svg"
              delay={600}
              imagePosition="left"
            />

            <LearnMoreSection
              title="Google Business Integration"
              description="Direct integration with Google Business Profile"
              features={[
                "Automatic review sync",
                "Direct review responses",
                "Business information management",
                "Google rating monitoring"
              ]}
              icon="Globe"
              imageUrl="/placeholder.svg"
              delay={800}
              imagePosition="right"
            />

            <LearnMoreSection
              title="Coming Soon"
              description="Exciting new integrations on the horizon"
              features={[
                "Meta Business Suite Integration",
                "Point of Sale (POS) Systems Integration",
                "Reservation System Integration",
                "Unified Dashboard for All Platforms"
              ]}
              icon="Rocket"
              imageUrl="/placeholder.svg"
              delay={1000}
              imagePosition="left"
            />

            <div className="text-center space-y-6 pt-8 animate-fadeIn">
              <h2 className="text-3xl font-bold">Ready to Transform Your Review Management?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join leading restaurants already using Hospitality Desk
              </p>
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="group"
              >
                Contact Sales
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </ScrollArea>
        
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 rounded-full p-4 animate-fadeIn"
            size="icon"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default LearnMore;