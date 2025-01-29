import { useBusinesses } from "@/hooks/useBusinesses";
import { BusinessCard } from "./BusinessCard";

interface BusinessListProps {
  onBusinessSelect?: (businessId: string) => void;
}

export const BusinessList = ({ onBusinessSelect }: BusinessListProps) => {
  const { businesses, isLoading } = useBusinesses();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {businesses?.map((business) => (
        <BusinessCard 
          key={business.id} 
          business={business}
          onClick={() => onBusinessSelect?.(business.id)}
          className="cursor-pointer hover:border-primary transition-colors"
        />
      ))}
    </div>
  );
};