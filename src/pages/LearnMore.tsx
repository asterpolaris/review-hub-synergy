import { Navigation } from "@/components/layout/Navigation";
import { LearnMoreSection } from "@/components/learn-more/LearnMoreSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

const LearnMore = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-16 animate-fadeIn">
          Discover Hospitality Desk Features
        </h1>
        <ScrollArea className="h-full">
          <div className="space-y-24 pb-24">
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
              icon="BarChart"
              imageUrl="/placeholder.svg"
              delay={400}
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
            />
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