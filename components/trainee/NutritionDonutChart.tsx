"use client";

interface NutritionData {
  fluids: number; // ml
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
}

interface NutritionTargets {
  fluids: number; // ml
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
}

interface NutritionDonutChartProps {
  data: NutritionData;
  targets: NutritionTargets;
  totalCalories: number;
  targetCalories: number;
}

export function NutritionDonutChart({ 
  data, 
  targets, 
  totalCalories, 
  targetCalories 
}: NutritionDonutChartProps) {
  const remainingCalories = targetCalories - totalCalories;
  const circumference = 2 * Math.PI * 56; // r = 56

  // Calculate stroke dash arrays for each nutrient
  const fluidsDash = (data.fluids / targets.fluids) * circumference;
  const proteinDash = (data.protein / targets.protein) * circumference;
  const fatDash = (data.fat / targets.fat) * circumference;
  const carbsDash = (data.carbs / targets.carbs) * circumference;

  // Calculate stroke dash offsets (stacked)
  const fluidsOffset = 0;
  const proteinOffset = -fluidsDash;
  const fatOffset = -(fluidsDash + proteinDash);
  const carbsOffset = -(fluidsDash + proteinDash + fatDash);

  const caloriesProgress = (totalCalories / targetCalories) * circumference;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Donut Chart */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              className="stroke-muted"
              strokeWidth="12"
            />
            {/* Fluids */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              className="stroke-primary"
              strokeWidth="12"
              strokeDasharray={`${Math.min(fluidsDash, circumference)} ${circumference}`}
              strokeDashoffset={fluidsOffset}
            />
            {/* Protein */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              className="stroke-blue-500"
              strokeWidth="12"
              strokeDasharray={`${Math.min(proteinDash, circumference)} ${circumference}`}
              strokeDashoffset={proteinOffset}
            />
            {/* Fat */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              className="stroke-red-500"
              strokeWidth="12"
              strokeDasharray={`${Math.min(fatDash, circumference)} ${circumference}`}
              strokeDashoffset={fatOffset}
            />
            {/* Carbs */}
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              className="stroke-orange-500"
              strokeWidth="12"
              strokeDasharray={`${Math.min(carbsDash, circumference)} ${circumference}`}
              strokeDashoffset={carbsOffset}
            />
          </svg>
        </div>
        <div className="mr-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">נוזלים</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">חלבון</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">שומן</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-muted-foreground">פחמימות</span>
          </div>
        </div>
      </div>

      {/* Calorie Gauge */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              className="stroke-muted"
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              className="stroke-primary"
              strokeWidth="12"
              strokeDasharray={`${Math.min(caloriesProgress, circumference)} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{remainingCalories}</span>
            <span className="text-xs text-muted-foreground">קק"ל חסר</span>
          </div>
        </div>
      </div>
    </div>
  );
}

