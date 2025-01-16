import { BusinessCard } from "./BusinessCard";
import { useBusinesses } from "@/hooks/useBusinesses";

export const BusinessList = () => {
  const { data: businesses, isLoading } = useBusinesses();

  if (isLoading) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        Loading businesses...
      </div>
    );
  }

  if (!businesses?.length) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        No businesses added yet. Click the button above to add your first
        business.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          name={business.name}
          location={business.location}
          googleBusinessAccountId={business.google_business_account_id}
        />
      ))}
    </div>
  );
};