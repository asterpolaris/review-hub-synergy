import { Check } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface LearnMoreSectionProps {
  title: string;
  description: string;
  features: string[];
  icon: string;
  imageUrl: string;
  delay?: number;
}

export const LearnMoreSection = ({
  title,
  description,
  features,
  icon,
  imageUrl,
  delay = 0
}: LearnMoreSectionProps) => {
  return (
    <div
      className={cn(
        "grid md:grid-cols-2 gap-12 items-center opacity-0",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Icon name={icon} className="w-8 h-8 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        
        <p className="text-lg text-muted-foreground">{description}</p>
        
        <ul className="space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="relative group">
        <div className="overflow-hidden rounded-xl border border-border">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
};