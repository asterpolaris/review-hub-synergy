import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricVariance } from "./MetricVariance";

interface MetricCardProps {
  title: string;
  value: string | number;
  variance: number;
  absoluteChange: number;
}

export const MetricCard = ({ title, value, variance, absoluteChange }: MetricCardProps) => {
  // Format the value if it's a number and represents a rating
  const formattedValue = typeof value === 'number' && title.toLowerCase().includes('rating')
    ? (value > 0 ? value.toFixed(2) : '-')
    : value;

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{formattedValue}</p>
        {variance !== 0 && (
          <MetricVariance value={variance} absoluteChange={absoluteChange} />
        )}
      </CardContent>
    </Card>
  );
};