import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { VenueSection } from "./types";

interface VenueSectionsProps {
  sections: VenueSection[];
}

export const VenueSections = ({ sections }: VenueSectionsProps) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      {sections.map((section, index) => (
        <AccordionItem value={`section-${index}`} key={index}>
          <AccordionTrigger className="text-lg font-medium">
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {section.content.map(({ label, value }) => 
                value && (
                  <div key={label} className="flex justify-between items-start py-1">
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm text-right ml-4 max-w-[60%]">{value}</span>
                  </div>
                )
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};