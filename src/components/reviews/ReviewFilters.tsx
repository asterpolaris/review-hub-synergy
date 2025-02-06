import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Calendar as CalendarIcon, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  visibleReviews: any[]; // Add this prop for the reviews to analyze
}

export const ReviewFilters = ({
  businesses,
  selectedLocations,
  selectedRatings,
  selectedReplyStatus,
  selectedSort,
  dateRange,
  onLocationChange,
  onRatingChange,
  onReplyStatusChange,
  onSortChange,
  onDateRangeChange,
  visibleReviews,
}: ReviewFiltersProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const { toast } = useToast();

  const handleAnalyzeReviews = async () => {
    if (visibleReviews.length === 0) {
      toast({
        title: "No reviews to analyze",
        description: "Please make sure there are visible reviews to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-reviews-by-venue', {
        body: { reviews: visibleReviews }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      toast({
        title: "Error analyzing reviews",
        description: "There was an error analyzing the reviews. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
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
                selected={{ from: dateRange?.from, to: dateRange?.to }}
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

        <Button
          variant="outline"
          onClick={handleAnalyzeReviews}
          disabled={isAnalyzing}
          className="ml-2"
        >
          <BarChart2 className="mr-2 h-4 w-4" />
          {isAnalyzing ? "Analyzing..." : "Analyze Reviews"}
        </Button>
      </div>

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Analysis by Venue</DialogTitle>
          </DialogHeader>
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans">{analysis}</pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};