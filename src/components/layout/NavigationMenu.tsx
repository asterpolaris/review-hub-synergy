
import { useLocation, Link } from "react-router-dom";
import { BarChart3, MessageSquare, Building2, Settings, Users } from "lucide-react";

const menuItems = [
  {
    to: "/dashboard",
    icon: BarChart3,
    label: "Dashboard"
  },
  {
    to: "/businesses",
    icon: Building2,
    label: "Businesses"
  },
  {
    to: "/reviews",
    icon: MessageSquare,
    label: "Reviews"
  },
  {
    to: "/client-experience",
    icon: Users,
    label: "Guest Experience"
  },
  {
    to: "/profile",
    icon: Settings,
    label: "Settings"
  }
];

export const NavigationMenu = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full p-4">
      <div className="py-4 border-b">
        <h2 className="text-lg font-semibold mb-1">Navigation</h2>
        <p className="text-sm text-muted-foreground">Access app features</p>
      </div>
      
      <nav className="flex-1 mt-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <li key={item.to}>
                <Link 
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? "bg-accent/50 text-accent-foreground font-medium" 
                      : "hover:bg-accent/20"
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/30">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="mt-auto pt-4 border-t">
        <div className="mb-3">
          <a 
            href="https://www.sevenrooms.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-accent/20"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/30">
              <span className="font-semibold text-sm">7R</span>
            </div>
            <span>Seven Rooms</span>
          </a>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          © {new Date().getFullYear()} JEGantic
        </p>
      </div>
    </div>
  );
};
