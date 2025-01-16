import { AppLayout } from "@/components/layout/AppLayout";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for testing
const mockReviews = [
  {
    id: "1",
    authorName: "John Doe",
    rating: 4,
    comment: "Great service and atmosphere! The staff was very friendly and helpful. Would definitely recommend to others.",
    createTime: "2024-01-15T10:30:00Z",
    photoUrls: [
      "https://picsum.photos/200/300",
      "https://picsum.photos/201/300"
    ]
  },
  {
    id: "2",
    authorName: "Jane Smith",
    rating: 3,
    comment: "Decent experience overall. Could improve on wait times but food was good.",
    createTime: "2024-01-14T15:45:00Z",
    reply: {
      comment: "Thank you for your feedback! We're working on improving our service times.",
      createTime: "2024-01-14T16:30:00Z"
    }
  }
];

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

        <div className="grid gap-6">
          {mockReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Reviews;