import { Link as RouterLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

interface SidebarMenuItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  external?: boolean;
}

export const SidebarMenuItem = ({ to, icon: Icon, label, isActive, external }: SidebarMenuItemProps) => {
  return (
    <SidebarMenuButton
      asChild
      data-active={isActive}
      tooltip={label}
    >
      {external ? (
        <a 
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </a>
      ) : (
        <RouterLink to={to} className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </RouterLink>
      )}
    </SidebarMenuButton>
  );
};