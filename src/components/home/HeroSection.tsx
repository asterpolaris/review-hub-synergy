import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[85vh] flex items-center">
      {/* Background gradient similar to Stripe */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-100 via-violet-50 to-white" />
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 animate-fadeIn">
            Hospitality reviews,{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              reimagined
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto animate-fadeIn [animation-delay:200ms]">
            Transform your online reputation with intelligent review management and AI-powered responses
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8 animate-fadeIn [animation-delay:400ms]">
            <Button 
              size="lg"
              onClick={() => navigate("/get-started")}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 h-auto text-lg rounded-xl transition-all duration-200 hover:scale-105"
            >
              Get started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate("/learn-more")}
              className="w-full sm:w-auto border-slate-300 hover:border-slate-400 px-8 py-6 h-auto text-lg rounded-xl transition-all duration-200 hover:scale-105"
            >
              Learn More
            </Button>
          </div>

          <p className="text-sm text-slate-500 pt-4">
            No credit card required · Free trial available
          </p>
        </div>
      </div>
    </div>
  );
};