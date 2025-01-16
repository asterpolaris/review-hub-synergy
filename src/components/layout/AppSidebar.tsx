import { Building2, Home, LogOut, Star, UserCircle2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/" },
  { title: "Businesses", icon: Building2, path: "/businesses" },
  { title: "Reviews", icon: Star, path: "/reviews" },
];

export function AppSidebar() {
  const location = useLocation();
  const { session } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={location.pathname === item.path ? "bg-accent" : ""}
                  >
                    <Link to={item.path} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 flex gap-2">
        <Button
          variant="ghost"
          className="flex-1 justify-start"
          asChild
        >
          <Link to="/profile" className="flex items-center gap-3">
            <UserCircle2 className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}