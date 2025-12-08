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
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
      <CardHeader className="p-5">
        <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl font-bold">יומן תזונה</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
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

