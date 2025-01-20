import { Building2, Home, Link, Star } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link as RouterLink, useLocation } from "react-router-dom";

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
  {
    icon: Link,
    label: "Sevenrooms",
    to: "https://www.sevenrooms.com",
    external: true,
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
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    data-active={location.pathname === item.to}
                  >
                    {item.external ? (
                      <a 
                        href={item.to} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </a>
                    ) : (
                      <RouterLink to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </RouterLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}