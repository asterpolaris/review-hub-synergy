import { Button } from "@/components/ui/button";
import { Mail, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { StakeholderDialog } from "./StakeholderDialog";

interface ReviewAnalysisProps {
  analysis: { sentiment: string; summary: string } | null;
  onSendEmail: () => void;
  isSendingEmail: boolean;
  venueName: string;
}

export const ReviewAnalysis = ({ 
  analysis, 
  onSendEmail, 
  isSendingEmail,
  venueName 
}: ReviewAnalysisProps) => {
  const [isStakeholderDialogOpen, setIsStakeholderDialogOpen] = useState(false);

  if (!analysis) return null;

  return (
    <div className="bg-muted p-4 rounded-md space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">AI Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStakeholderDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus size={16} />
            Add Stakeholder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSendEmail}
            disabled={isSendingEmail}
            className="flex items-center gap-2"
          >
            <Mail size={16} />
            {isSendingEmail ? "Sending..." : "Email Analysis"}
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm"><span className="font-medium">Sentiment:</span> {analysis.sentiment}</p>
        <p className="text-sm"><span className="font-medium">Summary:</span> {analysis.summary}</p>
      </div>
      <StakeholderDialog 
        isOpen={isStakeholderDialogOpen}
        onClose={() => setIsStakeholderDialogOpen(false)}
        venueName={venueName}
      />
    </div>
  );
};