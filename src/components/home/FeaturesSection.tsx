import { cn } from "@/lib/utils";
import {
  IconMessageDots,
  IconBuilding,
  IconStar,
  IconBrain,
  IconChartBar,
  IconClockHour4,
  IconShieldCheck,
  IconHeartHandshake,
} from "@tabler/icons-react";

const features = [
  {
    title: "Multi-Business Management",
    description: "Manage reviews across all your business locations from one centralized dashboard.",
    icon: <IconBuilding className="w-8 h-8" />,
  },
  {
    title: "Quick Responses",
    description: "Respond to customer reviews efficiently with our streamlined interface and AI assistance.",
    icon: <IconMessageDots className="w-8 h-8" />,
  },
  {
    title: "Review Monitoring",
    description: "Track and analyze your review metrics with detailed insights and real-time updates.",
    icon: <IconStar className="w-8 h-8" />,
  },
  {
    title: "AI-Powered Responses",
    description: "Generate professional, contextual responses using advanced AI technology.",
    icon: <IconBrain className="w-8 h-8" />,
  },
  {
    title: "Analytics Dashboard",
    description: "Visualize your performance with comprehensive analytics and reporting tools.",
    icon: <IconChartBar className="w-8 h-8" />,
  },
  {
    title: "24/7 Monitoring",
    description: "Stay on top of your reviews with round-the-clock monitoring and instant notifications.",
    icon: <IconClockHour4 className="w-8 h-8" />,
  },
  {
    title: "Secure Platform",
    description: "Your data is protected with enterprise-grade security and compliance measures.",
    icon: <IconShieldCheck className="w-8 h-8" />,
  },
  {
    title: "Customer Success",
    description: "Dedicated support team to help you maximize your review management strategy.",
    icon: <IconHeartHandshake className="w-8 h-8" />,
  },
];

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature glass-panel",
        (index === 0 || index === 4) && "lg:border-l",
        index < 4 && "lg:border-b"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-background to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-background to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-primary">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-primary/30 group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};

export const FeaturesSection = () => {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-3xl font-bold mb-4 text-white">Everything you need to manage reviews</h2>
        <p className="text-muted-foreground">Streamline your review management process with powerful tools</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <Feature
            key={feature.title}
            {...feature}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};