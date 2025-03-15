
import { Link as RouterLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
      className={cn(
        "flex items-center gap-3 my-1 px-4 py-3 rounded-xl transition-colors",
        isActive ? "bg-accent/50 text-primary-foreground" : "hover:bg-accent/20"
      )}
    >
      {external ? (
        <a 
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/30">
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-medium">{label}</span>
        </a>
      ) : (
        <RouterLink to={to} className="flex items-center gap-3 w-full">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/30">
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-medium">{label}</span>
        </RouterLink>
      )}
    </SidebarMenuButton>
  );
};
