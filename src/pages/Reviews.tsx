import { AppLayout } from "@/components/layout/AppLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Reviews = () => {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-semibold tracking-tight">Reviews</h1>
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by business" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-center py-12 text-muted-foreground">
          No reviews available. Add a business to start managing reviews.
        </div>
      </div>
    </AppLayout>
  );
};

export default Reviews;