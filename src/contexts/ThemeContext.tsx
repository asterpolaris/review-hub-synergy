
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isDashboardRoute = location.pathname.includes("/dashboard") || 
                          location.pathname.includes("/reviews") || 
                          location.pathname.includes("/businesses") || 
                          location.pathname.includes("/profile") || 
                          location.pathname.includes("/client-experience") || 
                          location.pathname.includes("/admin");

  // Initialize theme from system preference or localStorage, but enforce dark mode for non-dashboard pages
  const [theme, setTheme] = useState<Theme>(() => {
    if (!isDashboardRoute) {
      return "dark"; // Always use dark theme for non-dashboard routes
    }
    
    // For dashboard routes, respect the user preference
    // Check localStorage first
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    
    // Default to dark
    return "dark";
  });

  // Apply theme changes to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Save to localStorage (only for dashboard routes)
    if (isDashboardRoute) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, isDashboardRoute]);

  // Listen for system preference changes (only apply to dashboard routes)
  useEffect(() => {
    if (!isDashboardRoute) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    
    const handleChange = () => {
      // Only update if no preference is saved
      if (!localStorage.getItem("theme")) {
        setTheme(mediaQuery.matches ? "light" : "dark");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isDashboardRoute]);

  // Enforce dark theme for non-dashboard routes whenever route changes
  useEffect(() => {
    if (!isDashboardRoute) {
      setTheme("dark");
    }
  }, [isDashboardRoute]);

  const toggleTheme = () => {
    // Only allow toggling for dashboard routes
    if (isDashboardRoute) {
      setTheme(prevTheme => (prevTheme === "dark" ? "light" : "dark"));
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
