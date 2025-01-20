import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDemo } from "@/contexts/DemoContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const { isDemo } = useDemo();

  if (!session && !isDemo) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};