
import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "react-router-dom";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  // Determine if we're on a dashboard route
  const isDashboardRoute = location.pathname.includes("/dashboard") || 
                          location.pathname.includes("/reviews") || 
                          location.pathname.includes("/businesses") || 
                          location.pathname.includes("/profile") || 
                          location.pathname.includes("/client-experience") || 
                          location.pathname.includes("/admin");

  // If not on a dashboard route, don't render the toggle (dark mode is enforced)
  if (!isDashboardRoute) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full bg-accent/20 text-primary hover:bg-accent/30 hover:text-primary"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
