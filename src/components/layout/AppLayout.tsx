import { Settings, UserCircle2, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavigationMenu } from "./NavigationMenu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path === "/businesses") return "Businesses";
    if (path === "/reviews") return "Reviews";
    if (path.startsWith("/search")) return "Search";
    if (path === "/profile") return "Settings";
    return "";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };
  
  const firstName = session?.user?.user_metadata?.first_name || session?.user?.email?.split('@')[0] || '';

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-b from-background to-background/80">
      <main className="flex-1 overflow-auto">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{getPageTitle()}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              <NotificationBell />
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full bg-accent/20 text-primary hover:bg-accent/30 hover:text-primary"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="rounded-l-2xl p-0 w-80">
                  <NavigationMenu />
                </SheetContent>
              </Sheet>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-full bg-accent/20 text-primary hover:bg-accent/30 hover:text-primary"
                  >
                    <UserCircle2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  {firstName && (
                    <div className="px-2 py-1.5 mb-1">
                      <p className="text-sm font-medium">Hello, {firstName}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="flex items-center text-red-600 rounded-lg cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="animate-fadeIn">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
