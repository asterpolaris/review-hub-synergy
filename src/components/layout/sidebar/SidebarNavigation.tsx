import { useLocation } from "react-router-dom";
import { BarChart3, MessageSquare, Building2, Settings } from "lucide-react";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { SidebarGroupContent } from "@/components/ui/sidebar";

const menuItems = [
  {
    to: "/dashboard",
    icon: BarChart3,
    label: "Dashboard"
  },
  {
    to: "/reviews",
    icon: MessageSquare,
    label: "Reviews"
  },
  {
    to: "/businesses",
    icon: Building2,
    label: "Businesses"
  },
  {
    to: "https://sevenrooms.com",
    icon: Building2,
    label: "Sevenrooms",
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
    </SidebarGroupContent>
  );
};