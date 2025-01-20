import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";

export const AppSidebar = () => {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarHeader />
          <SidebarNavigation />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};