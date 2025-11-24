"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple } from "lucide-react";
import type { NutritionMenu } from "@/lib/types";

interface NutritionMenuCardProps {
  menu: NutritionMenu | null;
  variant?: "default" | "dark"; // default for dashboard, dark for nutrition page
}

export function NutritionMenuCard({ menu, variant = "default" }: NutritionMenuCardProps) {
  const isDark = variant === "dark";
  const cardClassName = isDark ? "bg-[#1a2332] border-gray-800" : "bg-card border-border shadow-md";
  const titleClassName = isDark ? "text-white" : "text-foreground";
  const textClassName = isDark ? "text-gray-400" : "text-muted-foreground";
  const mealBgClassName = isDark ? "bg-[#0f1a2a]" : "bg-accent/30";
  const mealTextClassName = isDark ? "text-white" : "text-foreground";
  const foodBgClassName = isDark ? "bg-[#1a2332]" : "bg-card";
  const foodBorderClassName = isDark ? "border-gray-800" : "border-border";
  const foodTextClassName = isDark ? "text-white" : "text-foreground";
  const foodAmountClassName = isDark ? "text-gray-400" : "text-muted-foreground";

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

