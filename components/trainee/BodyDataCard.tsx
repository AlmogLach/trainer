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
  
  // Generate weight path for SVG
  const generateWeightPath = (history: WeightDataPoint[]): string => {
    if (history.length < 2) return "";
    
    const weights = history.slice(0, 7).reverse(); // Take last 7 weights
    const maxW = Math.max(...weights.map(w => w.weight));
    const minW = Math.min(...weights.map(w => w.weight));
    const range = maxW - minW || 1;
    
    // Normalize data to coordinates (width 100, height 40)
    const points = weights.map((w, i) => {
      const x = (i / (weights.length - 1)) * 100;
      const y = 40 - ((w.weight - minW) / range) * 40;
      return `${x},${y}`;
    }).join(" ");
    
    return points;
  };

  const weightPath = generateWeightPath(weightHistory);

  return (
    <Card className="bg-gradient-to-br from-card via-card to-accent/10 border-2 border-border rounded-2xl sm:rounded-[2rem] shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-foreground text-lg sm:text-xl font-black">נתוני גוף</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {/* Morning Weight */}
          <div className="flex flex-col justify-center">
            {morningWeight ? (
              <>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 font-medium">משקל הבוקר:</p>
                <p className="text-2xl sm:text-3xl font-black text-foreground">{morningWeight} ק"ג</p>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 font-medium">משקל הבוקר:</p>
                <p className="text-lg text-muted-foreground">אין נתונים</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddWeight}
                  className="mt-2 border-input text-muted-foreground hover:bg-accent text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  הוסף משקל
                </Button>
              </>
            )}
          </div>

          {/* Weight Graph */}
          <div className="flex items-center justify-center">
            {weightHistory.length > 1 ? (
              <div className="w-full h-20 sm:h-24 relative">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <polyline
                    points={weightPath}
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Add green dots for data points */}
                  {chartData.map((point, i) => {
                    const maxW = Math.max(...chartData.map(w => w.weight));
                    const minW = Math.min(...chartData.map(w => w.weight));
                    const range = maxW - minW || 1;
                    const x = (i / (chartData.length - 1)) * 100;
                    const y = 40 - ((point.weight - minW) / range) * 40;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2"
                        className="fill-primary"
                      />
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="w-full h-20 sm:h-24 flex items-center justify-center text-muted-foreground text-xs">
                <p className="text-center">נדרשות 2 שקילות לגרף</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

