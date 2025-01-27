import { useLocation } from "react-router-dom";
import Header from "@/components/ui/21st-navbar";
import { Button } from "@/components/ui/21st-navbar";

const menuItems = [
  {
    text: "Home",
    to: "/"
  },
  {
    text: "Get Started",
    to: "/get-started"
  },
  {
    text: "Learn More",
    to: "/learn-more",
    items: [
      {
        text: "Features",
        description: "Explore our powerful features",
        to: "/learn-more#features"
      },
      {
        text: "Pricing",
        description: "View our pricing plans",
        to: "/learn-more#pricing"
      }
    ]
  }
];

export function Navigation() {
  const location = useLocation();
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Header
        theme="dark"
        isSticky
        isStickyOverlay
        logo={<span className="text-xl font-bold text-white">JEGantic</span>}
        menuItems={menuItems}
        rightContent={
          <Button 
            variant="outline"
            className="text-white"
            onClick={() => window.location.href = '/login'}
          >
            Login
          </Button>
        }
      />
    </div>
  );
}