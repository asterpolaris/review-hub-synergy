import { useLocation } from "react-router-dom";
import { Header1 } from "@/components/ui/header";

export function Navigation() {
  const location = useLocation();
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Header1 />
    </div>
  );
}