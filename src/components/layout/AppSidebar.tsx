import { Building2, Home, Star } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  {
    icon: Home,
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    icon: Building2,
    label: "Businesses",
    to: "/businesses",
  },
  {
    icon: Star,
    label: "Reviews",
    to: "/reviews",
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2">
            <SidebarGroupLabel className="text-lg font-semibold tracking-tight">
              JEGantic Hospitality Desk
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem
                  key={item.to}
                  icon={item.icon}
                  active={location.pathname === item.to}
                  asChild
                >
                  <Link to={item.to}>{item.label}</Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}