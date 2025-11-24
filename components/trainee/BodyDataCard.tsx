"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface WeightDataPoint {
  date: string;
  weight: number;
}

interface BodyDataCardProps {
  weightHistory: WeightDataPoint[];
  onAddWeight: () => void;
}

export function BodyDataCard({ weightHistory, onAddWeight }: BodyDataCardProps) {
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
  const morningWeight = currentWeight;

  // Prepare data for chart (last 7 data points, or all if less than 7)
  const chartData = weightHistory.slice(0, 7).reverse(); // Reverse to show oldest to newest
  
  // Calculate chart dimensions
  const chartWidth = 96;
  const chartHeight = 64;
  const padding = 8;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  // Calculate min/max for scaling
  const weights = chartData.map(d => d.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100;
  const weightRange = maxWeight - minWeight || 1;

  // Generate points for polyline
  const points = chartData.map((d, i) => {
    const x = padding + (i / (chartData.length - 1 || 1)) * graphWidth;
    const y = padding + graphHeight - ((d.weight - minWeight) / weightRange) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  // Generate polygon points (for fill area)
  const polygonPoints = points.length > 0 
    ? `${points} ${padding + graphWidth},${padding + graphHeight} ${padding},${padding + graphHeight}`
    : '';

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-foreground text-lg">נתוני גוף</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Weight Graph */}
          <div className="flex items-center justify-center">
            {chartData.length > 0 ? (
              <div className="w-24 h-16 relative">
                <svg className="w-full h-full">
                  <polyline
                    points={points}
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="2"
                  />
                  <polygon
                    points={polygonPoints}
                    className="fill-primary/20"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-24 h-16 flex items-center justify-center text-muted-foreground text-xs">
                אין נתונים
              </div>
            )}
          </div>

          {/* Morning Weight */}
          <div className="flex flex-col justify-center">
            {morningWeight ? (
              <>
                <p className="text-sm text-muted-foreground mb-1">משקל הבוקר:</p>
                <p className="text-2xl font-bold text-foreground">{morningWeight} ק"ג</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-1">משקל הבוקר:</p>
                <p className="text-lg text-muted-foreground">אין נתונים</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddWeight}
                  className="mt-2 border-input text-muted-foreground hover:bg-accent"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף משקל
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

