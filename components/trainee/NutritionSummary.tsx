"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NutritionDonutChart } from "./NutritionDonutChart";
import type { DailyNutritionLog } from "@/lib/types";
import type { NutritionTargets } from "@/lib/nutrition-config";

interface NutritionSummaryProps {
  nutritionLog: DailyNutritionLog | null;
  targets: NutritionTargets;
}

export function NutritionSummary({ nutritionLog, targets }: NutritionSummaryProps) {
  // Calculate nutrition data from log or use defaults
  const nutritionData = {
    fluids: 0, // TODO: Add fluids tracking to daily_nutrition_logs
    protein: nutritionLog?.total_protein ? Number(nutritionLog.total_protein) : 0,
    fat: nutritionLog?.total_fat ? Number(nutritionLog.total_fat) : 0,
    carbs: nutritionLog?.total_carbs ? Number(nutritionLog.total_carbs) : 0,
  };

  const totalCalories = nutritionLog?.total_calories 
    ? Number(nutritionLog.total_calories) 
    : (nutritionData.protein * 4 + nutritionData.carbs * 4 + nutritionData.fat * 9);

  return (
    <Card className="bg-gradient-to-br from-card via-card to-accent/10 border-2 border-border rounded-2xl sm:rounded-[2rem] shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-foreground text-lg sm:text-xl font-black">יומן תזונה</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <NutritionDonutChart
          data={nutritionData}
          targets={targets}
          totalCalories={totalCalories}
          targetCalories={targets.calories}
        />
      </CardContent>
    </Card>
  );
}

