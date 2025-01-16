import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

const Businesses = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Businesses</h1>
        </div>
        <div className="grid gap-4">
          <Link to="/businesses/manage">
            <Button variant="outline" className="w-full justify-start">
              <Building2 className="mr-2 h-4 w-4" />
              Manage Businesses
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default Businesses;