
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricVariance } from "./MetricVariance";

interface MetricCardProps {
  title: string;
  value: string | number;
  variance: number;
  absoluteChange: number;
}

export const MetricCard = ({ title, value, variance, absoluteChange }: MetricCardProps) => {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-5xl font-bold mb-2">{value}</p>
        {variance !== 0 && (
          <MetricVariance value={variance} absoluteChange={absoluteChange} />
        )}
      </CardContent>
    </Card>
  );
};
