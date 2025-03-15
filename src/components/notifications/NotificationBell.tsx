
import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNewReviewsNotification } from "@/hooks/useNewReviewsNotification";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";

export function NotificationBell() {
  const { newReviewsCount, clearNotifications } = useNewReviewsNotification();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewReviews = () => {
    setOpen(false);
    clearNotifications();
    navigate("/reviews");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-accent/20 text-primary hover:bg-accent/30 hover:text-primary relative"
        >
          <Bell className="h-5 w-5" />
          {newReviewsCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {newReviewsCount > 9 ? '9+' : newReviewsCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Notifications</h3>
          {newReviewsCount > 0 ? (
            <div className="space-y-4">
              <div className="text-sm">
                You have <span className="font-bold">{newReviewsCount}</span> new {newReviewsCount === 1 ? 'review' : 'reviews'} since your last visit.
              </div>
              <Button onClick={handleViewReviews} className="w-full">
                View New Reviews
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              You have no new notifications.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
