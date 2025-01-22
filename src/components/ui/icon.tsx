import { icons } from "lucide-react";
import { LucideProps } from "lucide-react";

interface IconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

export const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = icons[name as keyof typeof icons];
  return <LucideIcon {...props} />;
};