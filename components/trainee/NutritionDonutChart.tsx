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
  const caloriesPercent = Math.min(Math.round((totalCalories / targetCalories) * 100), 100);
  const totalMacros = data.protein + data.fat + data.carbs;
  const targetMacros = targets.protein + targets.fat + targets.carbs;
  const macroPercent = Math.min(Math.round((totalMacros / targetMacros) * 100), 100);

  return (
    <div className="space-y-4">
      {/* Two Large Progress Circles */}
      <div className="flex items-center justify-between gap-4">
        {/* Calories Circle - Green */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                className="stroke-muted/30"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                className="stroke-primary"
                strokeWidth="8"
                strokeDasharray={`${Math.min(caloriesProgress, circumference * 0.75)} ${circumference * 0.75}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl font-black text-primary">{caloriesPercent}%</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-2 text-center">קק"ל נצרך</p>
        </div>

        {/* Macros Circle - Blue */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                className="stroke-muted/30"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                className="stroke-blue-500"
                strokeWidth="8"
                strokeDasharray={`${Math.min((macroPercent / 100) * circumference * 0.75, circumference * 0.75)} ${circumference * 0.75}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl font-black text-blue-500">{macroPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Macros List */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-sm text-foreground font-bold">נוזלים</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-foreground font-bold">חלבון</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-foreground font-bold">שומן</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-sm text-foreground font-bold">פחמימות</span>
        </div>
      </div>
    </div>
  );
}

