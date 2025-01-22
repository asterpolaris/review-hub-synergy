import { icons } from "lucide-react";
import { LucideProps } from "lucide-react";

// Create a type from the keys of the icons object
type IconName = keyof typeof icons;

interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
}

export const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = icons[name];
  
  if (!LucideIcon) {
    console.error(`Icon "${name}" not found in lucide-react icons`);
    return null;
  }

  return <LucideIcon {...props} />;
};