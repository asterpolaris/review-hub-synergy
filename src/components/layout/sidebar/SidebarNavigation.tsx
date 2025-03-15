
import { useLocation } from "react-router-dom";
import { BarChart3, MessageSquare, Building2, Settings, Link, Layout, Search, Trophy, Star } from "lucide-react";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { SidebarGroupContent, SidebarMenu } from "@/components/ui/sidebar";

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
    to: "/search",
    icon: Search,
    label: "Search"
  },
  {
    to: "/client-experience",
    icon: Trophy,
    label: "My Teams"
  },
  {
    to: "https://www.sevenrooms.com/login",
    icon: Star,
    label: "Favorites",
    external: true
  },
  {
    to: "/profile",
    icon: Settings,
    label: "Settings"
  }
];

export const SidebarNavigation = () => {
  const location = useLocation();

  return (
    <SidebarGroupContent>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
            external={item.external}
          />
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  );
};
