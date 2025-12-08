"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple } from "lucide-react";
import type { NutritionMenu } from "@/lib/types";

interface NutritionMenuCardProps {
  menu: NutritionMenu | null;
  variant?: "default" | "dark"; // default for dashboard, dark for nutrition page
}

export function NutritionMenuCard({ menu, variant = "default" }: NutritionMenuCardProps) {
  const cardClassName = "border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl";
  const titleClassName = "text-gray-900 dark:text-white";
  const textClassName = "text-gray-500 dark:text-slate-400";
  const mealBgClassName = "bg-gray-50 dark:bg-slate-800/50";
  const mealTextClassName = "text-gray-900 dark:text-white";
  const foodBgClassName = "bg-white dark:bg-slate-900/50";
  const foodBorderClassName = "border-gray-200 dark:border-slate-800";
  const foodTextClassName = "text-gray-900 dark:text-white";
  const foodAmountClassName = "text-gray-500 dark:text-slate-400";

  if (!menu || !menu.meals || menu.meals.length === 0) {
    return (
      <Card className={cardClassName}>
        <CardHeader>
          <CardTitle className={`${titleClassName} flex items-center gap-2`}>
            <Apple className="h-5 w-5" />
            תפריט תזונה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`${textClassName} text-center py-4`}>
            אין תפריט תזונה מוגדר. המאמן שלך עדיין לא הגדיר תפריט עבורך.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className={`${titleClassName} flex items-center gap-2`}>
          <Apple className="h-5 w-5" />
          תפריט תזונה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {menu.meals.map((meal, mealIndex) => (
          <div key={meal.id || mealIndex} className={`border ${foodBorderClassName} rounded-lg p-4 ${mealBgClassName}`}>
            <h3 className={`text-lg font-semibold ${mealTextClassName} mb-3`}>{meal.mealName}</h3>
            {meal.foods && meal.foods.length > 0 ? (
              <div className="space-y-2">
                {meal.foods.map((food, foodIndex) => (
                  <div 
                    key={food.id || foodIndex} 
                    className={`flex items-center justify-between p-2 ${foodBgClassName} rounded border ${foodBorderClassName}`}
                  >
                    <div className="flex items-center gap-2">
                      <Apple className={`h-4 w-4 ${foodAmountClassName}`} />
                      <span className={`${foodTextClassName} text-sm`}>{food.foodName}</span>
                    </div>
                    {food.amount && (
                      <span className={`${foodAmountClassName} text-sm`}>{food.amount} גרם</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${textClassName} text-sm text-center py-2`}>אין מזונות בארוחה זו</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

