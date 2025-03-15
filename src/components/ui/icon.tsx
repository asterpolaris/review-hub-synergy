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

export const SevenRoomsLogo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 30 30"
      {...props}
    >
      <path 
        fill="currentColor" 
        d="M15,0C6.7,0,0,6.7,0,15s6.7,15,15,15,15-6.7,15-15S23.3,0,15,0ZM28.2,12.6c0,3.4-2.8,6.2-6.2,6.2s-6.2-2.8-6.2-6.2,2.8-6.2,6.2-6.2,6.2,2.8,6.2,6.2ZM15,1.4c3.8,0,7.2,1.5,9.6,4-.8-.3-1.7-.5-2.7-.5H5.9c2.4-2.2,5.6-3.5,9.1-3.5h0ZM14.3,12.6v15.9c-4.5-.2-8.5-2.7-10.8-6.3l10.9-10.9c0,.4-.1.8-.1,1.3ZM2.8,20.9c-.9-1.8-1.4-3.8-1.4-5.9,0-3.3,1.2-6.3,3.1-8.6h13c-.4.3-.8.6-1.1,1L2.8,20.9ZM15.7,28.6v-11.5c.3.4.7.8,1.1,1.2l7,7c-2.2,1.9-5,3.1-8.1,3.2ZM24.9,24.3l-4.1-4.1c.4,0,.8.1,1.2.1,2.8,0,5.2-1.5,6.5-3.6-.4,3-1.7,5.6-3.6,7.7Z"
      />
    </svg>
  );
};
