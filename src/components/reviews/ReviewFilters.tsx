import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ReviewFiltersProps {
  businesses: Array<{ google_place_id: string; name: string }>;
  selectedLocations: string[];
  selectedRatings: string[];
  selectedReplyStatus: string[];
  onLocationChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onReplyStatusChange: (value: string) => void;
  onApplyFilters: () => void;
}

export const ReviewFilters = ({
  businesses,
  selectedLocations,
  selectedRatings,
  selectedReplyStatus,
  onLocationChange,
  onRatingChange,
  onReplyStatusChange,
  onApplyFilters,
}: ReviewFiltersProps) => {
  return (
    <div className="flex gap-4 mb-6 items-end">
      <div className="w-64">
        <Select
          value={selectedLocations.join(",")}
          onValueChange={onLocationChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_businesses">All Businesses</SelectItem>
            {businesses?.map((business) => (
              <SelectItem key={business.google_place_id} value={business.google_place_id}>
                {business.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-64">
        <Select
          value={selectedRatings.join(",")}
          onValueChange={onRatingChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_ratings">All Ratings</SelectItem>
            {['1', '2', '3', '4', '5'].map((rating) => (
              <SelectItem key={rating} value={rating}>
                {rating} Stars
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-64">
        <Select
          value={selectedReplyStatus.join(",")}
          onValueChange={onReplyStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by reply status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_status">All</SelectItem>
            <SelectItem value="waiting">Waiting for Reply</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={onApplyFilters}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Apply Filters
      </Button>
    </div>
  );
};