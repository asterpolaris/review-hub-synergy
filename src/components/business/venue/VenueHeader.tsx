import { Button } from "@/components/ui/button";
import { Pencil, Trash2, X } from "lucide-react";

interface VenueHeaderProps {
  venueName: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onDelete: () => void;
  onEditContent: () => void;
}

export const VenueHeader = ({
  venueName,
  isEditing,
  onEditToggle,
  onDelete,
  onEditContent,
}: VenueHeaderProps) => {
  return (
    <div className="flex justify-between items-start mb-4">
      <h2 className="text-2xl font-semibold">{venueName}</h2>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onEditToggle}
        >
          {isEditing ? (
            <X className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </Button>
        {isEditing && (
          <>
            <Button variant="outline" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onEditContent}>
              Edit Content
            </Button>
          </>
        )}
      </div>
    </div>
  );
};