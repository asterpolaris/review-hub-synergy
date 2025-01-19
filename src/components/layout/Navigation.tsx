import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

export function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="px-1.5 py-1.5 bg-white/70 backdrop-blur-lg border border-white/20 rounded-full shadow-lg flex items-center gap-2">
        <Link to="/">
          <Button 
            variant={location.pathname === "/" ? "default" : "ghost"}
            className="rounded-full"
          >
            Home
          </Button>
        </Link>
        <Link to="/get-started">
          <Button 
            variant={location.pathname === "/get-started" ? "default" : "ghost"}
            className="rounded-full"
          >
            Get Started
          </Button>
        </Link>
        <Link to="/login">
          <Button 
            variant={location.pathname === "/login" ? "default" : "ghost"}
            className="rounded-full"
          >
            Login
          </Button>
        </Link>
      </div>
    </nav>
  );
}