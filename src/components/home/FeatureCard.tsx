import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard = ({ Icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <div
      className="p-8 rounded-2xl glass-panel hover:scale-105 transition-all duration-300 animate-fade-in cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="w-12 h-12 text-primary mb-6 animate-pulse" />
      <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};