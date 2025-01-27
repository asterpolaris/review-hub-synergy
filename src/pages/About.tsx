import { Navigation } from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      <div className="container mx-auto px-4 pt-32 pb-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-6 animate-fadeIn">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              About Hospitality Desk
            </h1>
            <p className="text-xl text-muted-foreground">
              Transforming how restaurants manage their online presence
            </p>
          </div>

          <div className="space-y-8 animate-fadeIn delay-100">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground">
                We're dedicated to helping restaurants and hospitality businesses build and maintain their online reputation through efficient review management and customer engagement.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Story</h2>
              <p className="text-muted-foreground">
                Founded by industry experts who understood the challenges of managing online reviews across multiple platforms, Hospitality Desk was created to streamline the process and help businesses maintain their online presence effectively.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Values</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Customer Success - Your success is our success</li>
                <li>Innovation - Continuously improving our platform</li>
                <li>Reliability - Providing stable and secure services</li>
                <li>Transparency - Clear and honest communication</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-8">
            <Button
              onClick={() => navigate("/get-started")}
              size="lg"
              className="group"
            >
              Join Us Today
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;