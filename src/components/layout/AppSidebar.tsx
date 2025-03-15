
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";
import { SidebarHeader as CustomSidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";

export const AppSidebar = () => {
  return (
    <Sidebar variant="floating" collapsible="icon" className="border-none">
      <SidebarContent className="p-2">
        <SidebarGroup className="bg-background/30 backdrop-blur-lg rounded-2xl shadow-lg p-2">
          <CustomSidebarHeader />
          <SidebarNavigation />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
