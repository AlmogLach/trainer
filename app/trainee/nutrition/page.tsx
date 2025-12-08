"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Apple, Beef, Home, BarChart3, Users, Target, Settings, Edit, Dumbbell, Plus, X, Zap, Flame, Activity } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getNutritionMenu, getNutritionSwaps, getDailyNutritionLog, upsertDailyNutritionLog } from "@/lib/db";
import { Input } from "@/components/ui/input";
import type { NutritionMenu } from "@/lib/types";
import { 
  FoodItem, 
  calculateMacros, 
  calculateSwapAmount, 
  calculateMacroDifferences,
  getMatchQuality,
  convertSwapToFoodItem 
} from "@/lib/nutrition-utils";
import { FoodSelectorCard } from "@/components/trainee/FoodSelectorCard";
import { NutritionMenuCard } from "@/components/trainee/NutritionMenuCard";
import { useToast } from "@/components/ui/toast";
import { getNutritionTargets } from "@/lib/nutrition-config";

function NutritionCalculatorContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [sourceFood, setSourceFood] = useState<FoodItem | null>(null);
  const [sourceAmount, setSourceAmount] = useState<string>("100");
  const [targetFood, setTargetFood] = useState<FoodItem | null>(null);
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  // Loaded from database via getNutritionSwaps()
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFoodLog, setShowFoodLog] = useState(false);
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [logFood, setLogFood] = useState<FoodItem | null>(null);
  const [logAmount, setLogAmount] = useState("");
  const [savingLog, setSavingLog] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Load data in parallel
      const [menu, swaps, log] = await Promise.all([
        getNutritionMenu(user.id).catch((err) => {
          console.error('Error loading nutrition menu:', err);
          return { meals: [] };
        }),
        getNutritionSwaps().catch((err) => {
          console.error('Error loading nutrition swaps:', err);
          console.error('Error details:', {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
          });
          // Show user-friendly error
          showToast(`שגיאה בטעינת המזונות: ${err.message || 'לא ניתן לטעון את המזונות. אנא בדוק את הגדרות RLS.'}`, "error", 5000);
          return []; // Return empty array if error
        }),
        getDailyNutritionLog(user.id).catch(() => null)
      ]);
      
      setNutritionMenu(menu || { meals: [] });
      setDailyLog(log);
      
      // Convert swaps to FoodItem format (all data comes from DB, no hardcoded values)
      const formattedSwaps = Array.isArray(swaps) ? swaps.map(convertSwapToFoodItem) : [];
      setAvailableFoods(formattedSwaps);
      
      console.log(`Loaded ${formattedSwaps.length} foods from database`);
      
      if (formattedSwaps.length === 0) {
        console.warn('No nutrition swaps found in database. Please add foods to nutrition_swaps table or check RLS policies.');
      }
    } catch (error: any) {
      console.error('Error loading nutrition data:', error);
      setNutritionMenu({ meals: [] });
      setAvailableFoods([]);
      // Show error to user
      showToast(`שגיאה בטעינת נתוני התזונה: ${error.message || 'שגיאה לא ידועה'}`, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  // Get foods from menu
  const menuFoods = nutritionMenu?.meals?.flatMap(meal =>
    meal.foods.map(food => ({
      name: food.foodName,
      amount: parseFloat(food.amount) || 0,
    }))
  ) || [];

  // Reset target food if it's not in the same category as source
  useEffect(() => {
    if (sourceFood && targetFood && sourceFood.category !== targetFood.category) {
      setTargetFood(null);
      setTargetAmount("");
    }
  }, [sourceFood]);

  const handleAddToLog = async () => {
    if (!logFood || !logAmount || !user?.id) return;

    try {
      setSavingLog(true);
      const amount = parseFloat(logAmount);
      if (isNaN(amount) || amount <= 0) {
        showToast('אנא הזן כמות תקינה', "warning", 3000);
        setSavingLog(false);
        return;
      }

      // Calculate macros for the amount
      const macros = calculateMacros(logFood, amount);
      
      console.log('Adding to log:', {
        food: logFood.name,
        amount,
        macros
      });
      
      // Get current log or create new
      const currentLog = dailyLog || {
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_calories: 0
      };

      // Add to existing totals
      const updatedLog = await upsertDailyNutritionLog(
        user.id,
        new Date().toISOString().split('T')[0],
        {
          total_protein: (currentLog.total_protein || 0) + macros.protein,
          total_carbs: (currentLog.total_carbs || 0) + macros.carbs,
          total_fat: (currentLog.total_fat || 0) + macros.fat,
          total_calories: (currentLog.total_calories || 0) + macros.calories
        }
      );

      console.log('Log updated successfully:', updatedLog);

      setDailyLog(updatedLog);
      setShowFoodLog(false);
      setLogFood(null);
      setLogAmount("");
      
      // Show success message
      showToast('✅ האוכל נוסף ללוג היומי!', "success", 3000);
    } catch (error: any) {
      console.error('Error adding to log:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      
      // Show detailed error
      showToast(`❌ שגיאה: ${error.message || 'לא ניתן להוסיף אוכל ללוג'}`, "error", 5000);
    } finally {
      setSavingLog(false);
    }
  };

  // Calculate swap when both foods are selected
  useEffect(() => {
    if (sourceFood && sourceAmount && targetFood && sourceFood.category === targetFood.category) {
      const amount = parseFloat(sourceAmount);
      if (!isNaN(amount) && amount > 0) {
        const calculatedAmount = calculateSwapAmount(sourceFood, amount, targetFood);
        setTargetAmount(calculatedAmount.toFixed(0));
      }
    }
  }, [sourceFood, sourceAmount, targetFood]);

  const sourceMacros = sourceFood && sourceAmount ? calculateMacros(sourceFood, parseFloat(sourceAmount) || 0) : null;
  const targetMacros = targetFood && targetAmount ? calculateMacros(targetFood, parseFloat(targetAmount) || 0) : null;

  // Calculate differences
  const macroDiffs = sourceMacros && targetMacros 
    ? calculateMacroDifferences(sourceMacros, targetMacros)
    : { protein: 0, carbs: 0, fat: 0, calories: 0 };

  // Calculate match quality
  const matchQuality = sourceMacros && targetMacros 
    ? getMatchQuality(sourceMacros, targetMacros)
    : { text: "—", color: "gray" as const, score: 0 };

  const proteinTarget = sourceMacros?.protein || 0;
  const carbsTarget = sourceMacros?.carbs || 0;
  const fatTarget = sourceMacros?.fat || 0;

  const proteinCurrent = targetMacros?.protein || 0;
  const carbsCurrent = targetMacros?.carbs || 0;
  const fatCurrent = targetMacros?.fat || 0;

  // Calculate nutrition progress
  const nutritionTargets = useMemo(() => getNutritionTargets(user?.id), [user?.id]);
  const nutritionProgress = useMemo(() => {
    if (!dailyLog) return null;
    return {
      protein: dailyLog.total_protein || 0,
      carbs: dailyLog.total_carbs || 0,
      fat: dailyLog.total_fat || 0,
      calories: dailyLog.total_calories || 0,
      proteinPercent: ((dailyLog.total_protein || 0) / nutritionTargets.protein) * 100,
      carbsPercent: ((dailyLog.total_carbs || 0) / nutritionTargets.carbs) * 100,
      fatPercent: ((dailyLog.total_fat || 0) / nutritionTargets.fat) * 100,
      caloriesPercent: ((dailyLog.total_calories || 0) / nutritionTargets.calories) * 100
    };
  }, [dailyLog, nutritionTargets]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-32" dir="rtl">
      {/* --- Page Header --- */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">מחשבון המרות</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mt-1">המר בין מזונות שונים ושמור על ערכים תזונתיים דומים</p>
      </div>

      {/* Daily Statistics Cards */}
      {nutritionProgress && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
          {/* Protein Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500/90 to-emerald-600/80 dark:from-emerald-600/80 dark:to-emerald-700/70 overflow-hidden rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-white/90 font-medium">חלבון</span>
              </div>
              <div className="space-y-2">
                <div className="text-white">
                  <span className="text-lg sm:text-xl font-black">{nutritionProgress.protein.toFixed(0)}</span>
                  <span className="text-xs sm:text-sm text-white/80 mr-1">/ {nutritionTargets.protein} גרם</span>
                </div>
                <div className="relative h-2 sm:h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      nutritionProgress.proteinPercent >= 80 ? 'bg-white' : 
                      nutritionProgress.proteinPercent >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                    }`}
                    style={{ width: `${Math.min(100, nutritionProgress.proteinPercent)}%` }}
                  />
                </div>
                <span className="text-xs text-white/80 font-medium">{nutritionProgress.proteinPercent.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Carbs Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500/90 to-blue-600/80 dark:from-blue-600/80 dark:to-blue-700/70 overflow-hidden rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <Apple className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-white/90 font-medium">פחמימות</span>
              </div>
              <div className="space-y-2">
                <div className="text-white">
                  <span className="text-lg sm:text-xl font-black">{nutritionProgress.carbs.toFixed(0)}</span>
                  <span className="text-xs sm:text-sm text-white/80 mr-1">/ {nutritionTargets.carbs} גרם</span>
                </div>
                <div className="relative h-2 sm:h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      nutritionProgress.carbsPercent >= 80 ? 'bg-white' : 
                      nutritionProgress.carbsPercent >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                    }`}
                    style={{ width: `${Math.min(100, nutritionProgress.carbsPercent)}%` }}
                  />
                </div>
                <span className="text-xs text-white/80 font-medium">{nutritionProgress.carbsPercent.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Fat Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-yellow-500/90 to-yellow-600/80 dark:from-yellow-600/80 dark:to-yellow-700/70 overflow-hidden rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-white/90 font-medium">שומן</span>
              </div>
              <div className="space-y-2">
                <div className="text-white">
                  <span className="text-lg sm:text-xl font-black">{nutritionProgress.fat.toFixed(1)}</span>
                  <span className="text-xs sm:text-sm text-white/80 mr-1">/ {nutritionTargets.fat} גרם</span>
                </div>
                <div className="relative h-2 sm:h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      nutritionProgress.fatPercent >= 80 ? 'bg-white' : 
                      nutritionProgress.fatPercent >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                    }`}
                    style={{ width: `${Math.min(100, nutritionProgress.fatPercent)}%` }}
                  />
                </div>
                <span className="text-xs text-white/80 font-medium">{nutritionProgress.fatPercent.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Calories Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500/90 to-purple-600/80 dark:from-purple-600/80 dark:to-purple-700/70 overflow-hidden rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-white/90 font-medium">קלוריות</span>
              </div>
              <div className="space-y-2">
                <div className="text-white">
                  <span className="text-lg sm:text-xl font-black">{nutritionProgress.calories.toFixed(0)}</span>
                  <span className="text-xs sm:text-sm text-white/80 mr-1">/ {nutritionTargets.calories} קק"ל</span>
                </div>
                <div className="relative h-2 sm:h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      nutritionProgress.caloriesPercent >= 80 ? 'bg-white' : 
                      nutritionProgress.caloriesPercent >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                    }`}
                    style={{ width: `${Math.min(100, nutritionProgress.caloriesPercent)}%` }}
                  />
                </div>
                <span className="text-xs text-white/80 font-medium">{nutritionProgress.caloriesPercent.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        {/* Nutrition Menu Card */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <NutritionMenuCard menu={nutritionMenu} variant="dark" />
        </div>

        {/* Add to Daily Log Button */}
        <Button
          onClick={() => setShowFoodLog(true)}
          className="w-full h-12 sm:h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: '50ms' }}
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
          הוסף אוכל ללוג היומי
        </Button>

        {/* Food Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
          <FoodSelectorCard
            title="מקור:"
            foodName={sourceFood?.name || null}
            amount={sourceFood && sourceAmount ? sourceAmount : null}
            icon={Apple}
            onSelect={() => setShowSourcePicker(true)}
          />
          <FoodSelectorCard
            title="יעד:"
            foodName={targetFood?.name || null}
            amount={targetFood && targetAmount ? targetAmount : null}
            icon={Beef}
            onSelect={() => setShowTargetPicker(true)}
          />
        </div>

        {/* Nutritional Breakdown */}
        {sourceMacros && targetMacros && (
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl animate-in zoom-in duration-500" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Protein */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold">חלבון</span>
                  <span className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium">{proteinCurrent.toFixed(0)} / {proteinTarget.toFixed(0)} גרם</span>
                </div>
                <div className="relative h-2 sm:h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  {proteinCurrent <= proteinTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-primary to-primary/80 rounded-full transition-all duration-700"
                        style={{ width: `${(proteinCurrent / proteinTarget) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500/50 rounded-full"
                        style={{ width: `${((proteinTarget - proteinCurrent) / proteinTarget) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-primary to-primary/80 rounded-full"
                        style={{ width: `${(proteinTarget / proteinCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500/70 rounded-full"
                        style={{ width: `${((proteinCurrent - proteinTarget) / proteinCurrent) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>

              {/* Carbohydrates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold">פחמימות</span>
                  <span className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium">{carbsCurrent.toFixed(0)} / {carbsTarget.toFixed(0)} גרם</span>
                </div>
                <div className="relative h-2 sm:h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  {carbsCurrent <= carbsTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-blue-500 to-blue-400 rounded-full transition-all duration-700"
                        style={{ width: `${(carbsCurrent / (carbsTarget || 1)) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500/50 rounded-full"
                        style={{ width: `${((carbsTarget - carbsCurrent) / (carbsTarget || 1)) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-blue-500 to-blue-400 rounded-full"
                        style={{ width: `${(carbsTarget / carbsCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500/70 rounded-full"
                        style={{ width: `${((carbsCurrent - carbsTarget) / carbsCurrent) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold">שומן</span>
                  <span className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium">{fatCurrent.toFixed(1)} / {fatTarget.toFixed(1)} גרם</span>
                </div>
                <div className="relative h-2 sm:h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  {fatCurrent <= fatTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
                        style={{ width: `${(fatCurrent / fatTarget) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500/50 rounded-full"
                        style={{ width: `${((fatTarget - fatCurrent) / fatTarget) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-yellow-500 to-yellow-400 rounded-full"
                        style={{ width: `${(fatTarget / fatCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500/70 rounded-full"
                        style={{ width: `${((fatCurrent - fatTarget) / fatCurrent) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary - Conversion Result */}
        {sourceFood && targetFood && sourceAmount && targetAmount && sourceMacros && targetMacros && (
          <Card className="bg-white dark:bg-slate-900/50 border-blue-500/30 dark:border-blue-600/30 border-2 shadow-lg shadow-blue-500/10 dark:shadow-blue-600/10 rounded-xl sm:rounded-2xl animate-in zoom-in duration-500" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl font-black">תוצאות ההמרה 🎯</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main conversion info */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium">מקור:</span>
                  <span className="text-gray-900 dark:text-white text-sm sm:text-base font-bold">
                    {sourceAmount} גרם {sourceFood.name}
                  </span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <div className="bg-blue-500/20 dark:bg-blue-600/20 p-2 rounded-xl">
                    <span className="text-blue-600 dark:text-blue-400 text-xl sm:text-2xl">⇄</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium">יעד (משוער):</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black text-base sm:text-xl">
                    ~{targetAmount} גרם {targetFood.name}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-slate-400 text-xs text-center mt-3 bg-white dark:bg-slate-900/50 rounded-lg p-2">
                  💡 הכמות משוערת - ערכים דומים, לא זהים בדיוק
                </p>
              </div>

              {/* Macros comparison */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                  <div className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs mb-1 font-bold uppercase">חלבון</div>
                  <div className="text-gray-900 dark:text-white font-black text-base sm:text-lg">
                    {targetMacros.protein.toFixed(1)}
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mr-1">גרם</span>
                    {Math.abs(macroDiffs.protein) > 2 && (
                      <span className={`text-[10px] sm:text-xs block mt-1 ${macroDiffs.protein > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                        ({macroDiffs.protein > 0 ? '+' : ''}{macroDiffs.protein.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                  <div className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs mb-1 font-bold uppercase">פחמימות</div>
                  <div className="text-gray-900 dark:text-white font-black text-base sm:text-lg">
                    {targetMacros.carbs.toFixed(1)}
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mr-1">גרם</span>
                    {Math.abs(macroDiffs.carbs) > 5 && (
                      <span className={`text-[10px] sm:text-xs block mt-1 ${macroDiffs.carbs > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                        ({macroDiffs.carbs > 0 ? '+' : ''}{macroDiffs.carbs.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                  <div className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs mb-1 font-bold uppercase">שומן</div>
                  <div className="text-gray-900 dark:text-white font-black text-base sm:text-lg">
                    {targetMacros.fat.toFixed(1)}
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mr-1">גרם</span>
                    {Math.abs(macroDiffs.fat) > 2 && (
                      <span className={`text-[10px] sm:text-xs block mt-1 ${macroDiffs.fat > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                        ({macroDiffs.fat > 0 ? '+' : ''}{macroDiffs.fat.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/50 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                  <div className="text-gray-500 dark:text-slate-400 text-[10px] sm:text-xs mb-1 font-bold uppercase">קלוריות</div>
                  <div className="text-gray-900 dark:text-white font-black text-base sm:text-lg">
                    {targetMacros.calories.toFixed(0)}
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mr-1">קק"ל</span>
                    {Math.abs(macroDiffs.calories) > 20 && (
                      <span className={`text-[10px] sm:text-xs block mt-1 ${macroDiffs.calories > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                        ({macroDiffs.calories > 0 ? '+' : ''}{macroDiffs.calories.toFixed(0)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match quality */}
              <div className={`flex items-center justify-between pt-3 mt-3 border-t-2 ${
                matchQuality.color === 'green' ? 'border-blue-500/30 dark:border-blue-600/30' :
                matchQuality.color === 'yellow' ? 'border-yellow-400/30' :
                'border-red-400/30'
              }`}>
                <span className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium">דיוק ההמרה:</span>
                <span className={`font-black text-base sm:text-lg ${
                  matchQuality.color === 'green' ? 'text-blue-600 dark:text-blue-400' :
                  matchQuality.color === 'yellow' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {matchQuality.text}
                </span>
              </div>
              {matchQuality.color === 'green' && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-center">
                  <p className="text-primary text-sm font-bold">
                    ✓ התאמה מצוינת - ערכים דומים למקור
                  </p>
                </div>
              )}
              {matchQuality.color === 'yellow' && (
                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3 text-center">
                  <p className="text-yellow-400 text-sm font-bold">
                    ⚠ התאמה סבירה - יש הבדל קטן בערכים
                  </p>
                </div>
              )}
              {matchQuality.color === 'red' && (
                <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-sm font-bold">
                    ⚠ התאמה נמוכה - הבדל משמעותי בערכים
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FoodsDictionary Search Box */}
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg font-black flex items-center gap-2">
              <div className="bg-blue-500/20 dark:bg-blue-600/20 p-2 rounded-xl">
                <Apple className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              חיפוש מזונות
            </CardTitle>
            <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">FoodsDictionary - מאגר ערכים תזונתיים</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-center" dir="rtl">
              <form 
                name="SearchFoods" 
                action="https://www.foodsdictionary.co.il/FoodsSearch.php" 
                method="get"
                className="w-full"
              >
                <div className="flex gap-2 items-center">
                  <input 
                    type="hidden" 
                    name="utm_source" 
                    value="affiliate" 
                  />
                  <input 
                    type="hidden" 
                    name="utm_medium" 
                    value="free-box" 
                  />
                  <input 
                    type="hidden" 
                    name="utm_campaign" 
                    value="foods-search" 
                  />
                  <input 
                    type="text" 
                    name="q" 
                    maxLength={200}
                    placeholder="חפש מזון לקבלת ערכים תזונתיים מדויקים..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-600 transition-all text-sm sm:text-base font-medium"
                    style={{
                      backgroundImage: "url('https://storage.googleapis.com/st2.foodsd.co.il/Images/logo-small-v3.0-watermark.png')",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "4px 3px"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundImage = "none";
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.value) {
                        e.currentTarget.style.backgroundImage = "url('https://storage.googleapis.com/st2.foodsd.co.il/Images/logo-small-v3.0-watermark.png')";
                      }
                    }}
                  />
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-black px-4 sm:px-8 py-2 sm:py-3 h-auto rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm sm:text-base"
                  >
                    חיפוש
                  </Button>
                </div>
              </form>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-xs text-center mt-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-2">
              💡 השתמש בחיפוש זה כדי למצוא ערכים תזונתיים מדויקים למזונות שונים
            </p>
          </CardContent>
        </Card>

        {/* Info Card - This is just a calculator, not a logger */}
        {sourceFood && targetFood && sourceAmount && targetAmount && (
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-600/10 dark:to-blue-700/5 border-blue-500/30 dark:border-blue-600/30 border-2 shadow-md rounded-xl sm:rounded-2xl animate-in fade-in zoom-in duration-500" style={{ animationDelay: '500ms' }}>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-blue-500/20 dark:bg-blue-600/20 p-2 rounded-xl">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-gray-900 dark:text-white text-sm sm:text-base font-black">
                    מחשבון המרות
                  </p>
                </div>
                <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                  עוזר לך לגוון את התזונה בצורה מדויקת
                </p>
                <p className="text-gray-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900/50 rounded-xl p-3">
                  השתמש במידע הזה כדי להחליף מזונות בתפריט שלך תוך שמירה על ערכים תזונתיים דומים
                </p>
                {matchQuality.score < 0.3 && (
                  <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-3">
                    <p className="text-yellow-400 text-sm font-bold">
                      ⚠️ התאמה {matchQuality.text} - ייתכן שיהיה צורך להתאים את הכמות
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Food Picker Modals */}
      {showSourcePicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200" onClick={() => setShowSourcePicker(false)}>
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-2xl w-full h-full sm:h-auto sm:max-w-md sm:max-h-[80vh] overflow-hidden rounded-none sm:rounded-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-600/10 dark:to-blue-700/5 p-4 sm:p-5">
              <CardTitle className="text-gray-900 dark:text-white font-black text-lg sm:text-xl flex items-center gap-2">
                <div className="bg-blue-500/20 dark:bg-blue-600/20 p-2 rounded-xl">
                  <Apple className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                בחר מזון מקור
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 sm:p-6 max-h-[calc(100vh-200px)] sm:max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">טוען מזונות...</p>
                </div>
              ) : availableFoods.length === 0 ? (
                <div className="text-center text-gray-400 py-4 space-y-2">
                  <p className="font-semibold">אין מזונות זמינים</p>
                  <p className="text-sm">אנא הוסף מזונות לטבלת nutrition_swaps במסד הנתונים</p>
                  <p className="text-xs text-gray-500 mt-2">
                    או בדוק שהטבלה קיימת ושה-RLS מוגדר נכון
                  </p>
                </div>
              ) : (
                <>
                  {/* Show menu foods first if available */}
                  {menuFoods.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3 px-2">
                        <div className="bg-blue-500/20 dark:bg-blue-600/20 p-1 rounded-lg">
                          <Apple className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wide">מהתפריט שלך</p>
                      </div>
                      {menuFoods.map((menuFood, index) => {
                        const food = availableFoods.find(f => f.name === menuFood.name);
                        if (!food) return null;
                        return (
                          <button
                            key={`menu-${index}`}
                            className="w-full text-right p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-600/10 dark:to-blue-700/5 hover:from-blue-500/20 hover:to-blue-600/10 dark:hover:from-blue-600/20 dark:hover:to-blue-700/10 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white transition-all mb-2 border-2 border-blue-500/30 dark:border-blue-600/30 active:scale-98 shadow-sm"
                            onClick={() => {
                              setSourceFood(food);
                              setSourceAmount(menuFood.amount.toString());
                              setShowSourcePicker(false);
                            }}
                          >
                            <div className="font-black text-sm sm:text-base">{food.name}</div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">{menuFood.amount} גרם</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Show all available foods */}
                  <div>
                    {menuFoods.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 px-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wide">כל המזונות הזמינים</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {availableFoods
                        .filter(food => {
                          // Don't show foods that are already in menu (to avoid duplicates)
                          if (menuFoods.length > 0) {
                            return !menuFoods.some(mf => mf.name === food.name);
                          }
                          return true;
                        })
                        .map((food) => (
                          <button
                            key={food.id}
                            className="w-full text-right p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-500/30 dark:hover:border-blue-600/30 active:scale-98 text-sm sm:text-base"
                            onClick={() => {
                              setSourceFood(food);
                              setSourceAmount("100");
                              setShowSourcePicker(false);
                            }}
                          >
                            <div className="font-bold">{food.name}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showTargetPicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200" onClick={() => setShowTargetPicker(false)}>
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-2xl w-full h-full sm:h-auto sm:max-w-md sm:max-h-[80vh] overflow-hidden rounded-none sm:rounded-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-600/10 dark:to-blue-700/5 p-4 sm:p-5">
              <CardTitle className="text-gray-900 dark:text-white font-black text-lg sm:text-xl flex items-center gap-2">
                <div className="bg-blue-500/20 dark:bg-blue-600/20 p-2 rounded-xl">
                  <Beef className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  בחר מזון יעד
                  {sourceFood && (
                    <span className="text-xs text-gray-500 dark:text-slate-400 block mt-1 font-medium">
                      רק מזונות מ-{sourceFood.category === 'carbs' ? 'פחמימות' : sourceFood.category === 'protein' ? 'חלבון' : sourceFood.category === 'fat' ? 'שומן' : sourceFood.category === 'bread' ? 'לחם' : sourceFood.category}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[calc(100vh-200px)] sm:max-h-[60vh] overflow-y-auto p-4 sm:p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">טוען מזונות...</p>
                </div>
              ) : availableFoods.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-slate-400 py-8 space-y-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="text-4xl">📭</div>
                  <p className="font-bold text-gray-900 dark:text-white">אין מזונות זמינים</p>
                  <p className="text-xs sm:text-sm">אנא הוסף מזונות לטבלת nutrition_swaps במסד הנתונים</p>
                  <p className="text-xs bg-white dark:bg-slate-900/50 rounded-xl p-2 mt-2">
                    או בדוק שהטבלה קיימת ושה-RLS מוגדר נכון
                  </p>
                </div>
              ) : !sourceFood ? (
                <div className="text-center text-gray-500 dark:text-slate-400 py-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="font-bold text-gray-900 dark:text-white">אנא בחר מזון מקור קודם</p>
                </div>
              ) : (
                (() => {
                  // Filter foods by same category as source food
                  const sameCategoryFoods = availableFoods.filter(f => 
                    f.id !== sourceFood.id && 
                    f.category === sourceFood.category
                  );
                  
                  if (sameCategoryFoods.length === 0) {
                    return (
                      <div className="text-center text-gray-500 dark:text-slate-400 py-8 space-y-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                        <div className="text-4xl">🔍</div>
                        <p className="font-bold text-gray-900 dark:text-white">אין מזונות נוספים בקטגוריה "{sourceFood.category}"</p>
                        <p className="text-xs bg-white dark:bg-slate-900/50 rounded-xl p-2 mt-2">אנא הוסף מזונות נוספים לקטגוריה זו</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-2">
                      {sameCategoryFoods.map((food) => (
                        <button
                          key={food.id}
                          className="w-full text-right p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl sm:rounded-2xl text-gray-900 dark:text-white transition-all border border-gray-200 dark:border-slate-700 hover:border-blue-500/30 dark:hover:border-blue-600/30 active:scale-98 text-sm sm:text-base"
                          onClick={() => {
                            setTargetFood(food);
                            setShowTargetPicker(false);
                          }}
                        >
                          <div className="font-bold">{food.name}</div>
                        </button>
                      ))}
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add to Log Modal */}
      {showFoodLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200" onClick={() => setShowFoodLog(false)}>
          <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 shadow-2xl w-full h-full sm:h-auto sm:max-w-md overflow-hidden rounded-none sm:rounded-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-500/10 to-green-600/5 dark:from-green-600/10 dark:to-green-700/5 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-green-500/20 dark:bg-green-600/20 p-2 rounded-xl">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-gray-900 dark:text-white font-black text-lg sm:text-xl">הוסף אוכל ללוג</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFoodLog(false)}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6 max-h-[calc(100vh-200px)] sm:max-h-[80vh] overflow-y-auto">
              {!logFood ? (
                <>
                  <p className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-medium text-center">בחר מזון מהרשימה:</p>
                  <div className="space-y-2 max-h-[calc(100vh-300px)] sm:max-h-[50vh] overflow-y-auto">
                    {availableFoods.map((food) => (
                      <button
                        key={food.name}
                        onClick={() => setLogFood(food)}
                        className="w-full text-right p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-green-500/50 dark:hover:border-green-600/50 rounded-xl font-bold text-gray-900 dark:text-white transition-all active:scale-98 text-sm sm:text-base"
                      >
                        {food.name}
                        <span className="text-xs text-gray-500 dark:text-slate-400 block mt-1 font-medium">
                          {food.category === 'carbs' ? 'פחמימות' : food.category === 'protein' ? 'חלבון' : food.category === 'fat' ? 'שומן' : food.category === 'bread' ? 'לחם' : food.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-gray-200 dark:border-slate-700">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">מזון נבחר:</p>
                    <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{logFood.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {logFood.proteinPer100g}g חלבון | {logFood.carbsPer100g}g פחמימות | {logFood.fatPer100g}g שומן (ל-100גרם)
                    </p>
                  </div>

                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-bold mb-2 block">כמות (גרם):</label>
                    <Input
                      type="number"
                      step="1"
                      value={logAmount}
                      onChange={(e) => setLogAmount(e.target.value)}
                      placeholder="100"
                      className="w-full h-12 sm:h-14 text-xl sm:text-2xl font-black bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 focus:border-green-500 dark:focus:border-green-600 text-gray-900 dark:text-white text-center rounded-xl"
                      autoFocus
                    />
                  </div>

                  {logAmount && parseFloat(logAmount) > 0 && (
                    <div className="bg-green-500/10 dark:bg-green-600/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-green-500/30 dark:border-green-600/30">
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-2">ערכים תזונתיים:</p>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="text-center">
                          <p className="text-base sm:text-lg font-black text-green-600 dark:text-green-400">
                            {calculateMacros(logFood, parseFloat(logAmount)).protein.toFixed(1)}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">חלבון</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base sm:text-lg font-black text-green-600 dark:text-green-400">
                            {calculateMacros(logFood, parseFloat(logAmount)).carbs.toFixed(1)}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">פחמימות</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base sm:text-lg font-black text-green-600 dark:text-green-400">
                            {calculateMacros(logFood, parseFloat(logAmount)).fat.toFixed(1)}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">שומן</p>
                        </div>
                      </div>
                      <div className="text-center mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                          {calculateMacros(logFood, parseFloat(logAmount)).calories.toFixed(0)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">קלוריות</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 sm:gap-3">
                    <Button
                      onClick={() => {
                        setLogFood(null);
                        setLogAmount("");
                      }}
                      variant="outline"
                      className="flex-1 h-10 sm:h-12 border-2 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 font-bold rounded-xl text-sm sm:text-base"
                    >
                      שנה מזון
                    </Button>
                    <Button
                      onClick={handleAddToLog}
                      disabled={!logAmount || parseFloat(logAmount) <= 0 || savingLog}
                      className="flex-1 h-10 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 text-white font-black rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 text-sm sm:text-base"
                    >
                      {savingLog ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : "הוסף ללוג"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

export default function NutritionCalculator() {
  return <NutritionCalculatorContent />;
}
