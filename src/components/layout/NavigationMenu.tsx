
import { useLocation, Link } from "react-router-dom";
import { BarChart3, MessageSquare, Building2, Settings, Users } from "lucide-react";
import { SevenRoomsLogo } from "@/components/ui/icon";

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
    <div className="flex flex-col h-full p-5">
      <div className="py-5 border-b">
        <h2 className="text-xl font-semibold mb-2">Navigation</h2>
        <p className="text-base text-muted-foreground">Access app features</p>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <li key={item.to}>
                <Link 
                  to={item.to}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-colors text-base ${
                    isActive 
                      ? "bg-accent/50 text-accent-foreground font-medium" 
                      : "hover:bg-accent/20"
                  }`}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/30">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-lg">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="mt-auto pt-5 border-t">
        <div className="mb-4">
          <a 
            href="https://www.sevenrooms.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-4 rounded-xl transition-colors hover:bg-accent/20"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/30">
              <SevenRoomsLogo className="h-7 w-7" />
            </div>
            <span className="text-lg">Seven Rooms</span>
          </a>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          © {new Date().getFullYear()} JEGantic
        </p>
      </div>
    </div>
  );
};
