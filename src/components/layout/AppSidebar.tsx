import { Building2, Home, LogOut, Star, UserCircle2, ExternalLink } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/dashboard" },
  { title: "Businesses", icon: Building2, path: "/businesses" },
  { title: "Reviews", icon: Star, path: "/reviews" },
  { 
    title: "SevenRooms", 
    icon: ExternalLink, 
    path: "https://www.sevenrooms.com/login",
    external: true 
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold tracking-tight">
            JEGantic Hospitality Desk
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={!item.external && location.pathname === item.path ? "bg-accent" : ""}
                    tooltip={item.title}
                  >
                    {item.external ? (
                      <a 
                        href={item.path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    ) : (
                      <Link to={item.path} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 flex flex-col gap-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          asChild
        >
          <Link to="/profile" className="flex items-center gap-3">
            <UserCircle2 className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}