import { useLocation } from "react-router-dom";
import { BarChart3, MessageSquare, Building2, Settings, Link, Layout } from "lucide-react";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { SidebarGroupContent } from "@/components/ui/sidebar";

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
    icon: Layout,
    label: "Client Experience"
  },
  {
    to: "https://www.sevenrooms.com/login",
    icon: Link,
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