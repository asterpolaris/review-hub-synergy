import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Calendar as CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface ReviewFiltersProps {
  businesses: Array<{ google_place_id: string; name: string }>;
  selectedLocations: string[];
  selectedRatings: string[];
  selectedReplyStatus: string[];
  selectedSort: string;
  dateRange: { from: Date | undefined; to: Date | undefined } | undefined;
  onLocationChange: (value: string) => void;
  onRatingChange: (value: string) => void;
  onReplyStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined } | undefined) => void;
}

export const ReviewFilters = ({
  businesses = [],
  selectedLocations = [],
  selectedRatings = [],
  selectedReplyStatus = [],
  selectedSort = "newest",
  dateRange,
  onLocationChange,
  onRatingChange,
  onReplyStatusChange,
  onSortChange,
  onDateRangeChange,
}: ReviewFiltersProps) => {
  const [openLocation, setOpenLocation] = useState(false);
  const [openRating, setOpenRating] = useState(false);

  const handleLocationSelect = (locationId: string) => {
    if (!selectedLocations) return;
    
    let newLocations: string[];
    
    if (locationId === "all_businesses") {
      newLocations = [];
    } else if (selectedLocations.includes(locationId)) {
      newLocations = selectedLocations.filter(id => id !== locationId);
    } else {
      newLocations = [...selectedLocations, locationId];
    }
    
    onLocationChange(newLocations.join(","));
  };

  const handleRatingSelect = (rating: string) => {
    if (!selectedRatings) return;
    
    let newRatings: string[];
    
    if (rating === "all_ratings") {
      newRatings = [];
    } else if (selectedRatings.includes(rating)) {
      newRatings = selectedRatings.filter(r => r !== rating);
    } else {
      newRatings = [...selectedRatings, rating];
    }
    
    onRatingChange(newRatings.join(","));
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6 items-end">
      <div className="w-64">
        <Popover open={openLocation} onOpenChange={setOpenLocation}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedLocations.length > 0 ? (
                <>
                  <span className="mr-2">{selectedLocations.length} selected</span>
                  <Badge variant="secondary">
                    {selectedLocations.length}
                  </Badge>
                </>
              ) : (
                "Filter by location"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search locations..." />
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleLocationSelect("all_businesses")}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedLocations.length === 0 ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Businesses
                </CommandItem>
                {businesses?.map((business) => (
                  <CommandItem
                    key={business.google_place_id}
                    onSelect={() => handleLocationSelect(business.google_place_id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedLocations.includes(business.google_place_id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {business.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-64">
        <Popover open={openRating} onOpenChange={setOpenRating}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedRatings.length > 0 ? (
                <>
                  <span className="mr-2">{selectedRatings.length} selected</span>
                  <Badge variant="secondary">
                    {selectedRatings.length}
                  </Badge>
                </>
              ) : (
                "Filter by rating"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleRatingSelect("all_ratings")}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedRatings.length === 0 ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Ratings
                </CommandItem>
                {['1', '2', '3', '4', '5'].map((rating) => (
                  <CommandItem
                    key={rating}
                    onSelect={() => handleRatingSelect(rating)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedRatings.includes(rating) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {rating} Stars
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="w-64">
        <Select
          value={selectedReplyStatus[0] || "all"}
          onValueChange={onReplyStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by reply status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="waiting">Waiting for Reply</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-64">
        <Select
          value={selectedSort}
          onValueChange={onSortChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Newest First
              </div>
            </SelectItem>
            <SelectItem value="oldest">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Oldest First
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[300px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                "Filter by date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {dateRange && (
        <Button 
          variant="ghost" 
          className="px-2 h-8"
          onClick={() => onDateRangeChange(undefined)}
        >
          Clear dates
        </Button>
      )}
    </div>
  );
};