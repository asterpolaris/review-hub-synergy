
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricVarianceProps {
  value: number;
  absoluteChange: number;
}

export const MetricVariance = ({ value, absoluteChange }: MetricVarianceProps) => {
  // If value is NaN or undefined, we'll show no variance
  if (isNaN(value) || value === undefined) {
    return null;
  }
  
  const isPositive = value > 0;
  return (
    <div className={cn(
      "text-base flex items-center gap-2 mt-2",
      isPositive ? "text-green-600" : "text-red-600"
    )}>
      {isPositive ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
      <span>{Math.abs(value).toFixed(1)}% ({absoluteChange > 0 ? '+' : ''}{absoluteChange})</span>
    </div>
  );
};
