"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Edit, Trash2, Loader2, PieChart, Filter, ArrowUpDown, Users, Target, TrendingUp, Apple
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getTrainerTrainees, getActiveWorkoutPlan, getNutritionMenu, getNutritionSwaps } from "@/lib/db";
import type { User, NutritionMenu } from "@/lib/types";
import { calculateMacros, convertSwapToFoodItem, type FoodItem } from "@/lib/nutrition-utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";

interface NutritionPlanCard {
  id: string;
  traineeId: string;
  traineeName: string;
  planName: string;
  calorieTarget: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt?: string;
}

type SortOption = 'name' | 'trainee' | 'calories' | 'date';
type FilterOption = 'all' | 'low' | 'medium' | 'high';

function NutritionPlansContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanCard[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [calorieFilter, setCalorieFilter] = useState<FilterOption>('all');
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadNutritionPlans();
      loadFoodDatabase();
    }
  }, [trainerId]);

  const loadFoodDatabase = async () => {
    try {
      const swaps = await getNutritionSwaps();
      const foods = swaps.map(convertSwapToFoodItem);
      setAvailableFoods(foods);
    } catch (error: any) {
      console.error("Error loading food database:", error);
    }
  };

  const loadNutritionPlans = async () => {
    try {
      setLoading(true);
      
      // Get all trainees
      const trainees = await getTrainerTrainees(trainerId);
      
      // Get nutrition plans for each trainee
      const plans: NutritionPlanCard[] = [];
      
      for (const trainee of trainees) {
        const workoutPlan = await getActiveWorkoutPlan(trainee.id);
        if (workoutPlan) {
          const nutritionMenu = await getNutritionMenu(trainee.id);
          
          if (nutritionMenu) {
            // Calculate macros from nutrition menu using food database
            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            
            nutritionMenu.meals.forEach(meal => {
              meal.foods.forEach(food => {
                const amount = parseFloat(food.amount) || 0;
                if (amount > 0 && food.foodName) {
                  // Find food in database
                  const foodItem = availableFoods.find(
                    f => f.name.toLowerCase() === food.foodName.toLowerCase()
                  );
                  
                  if (foodItem) {
                    // Use accurate calculation from database
                    const macros = calculateMacros(foodItem, amount);
                    totalProtein += macros.protein;
                    totalCarbs += macros.carbs;
                    totalFat += macros.fat;
                    totalCalories += macros.calories;
                  } else {
                    // Fallback: use estimated values if food not found in database
                    totalProtein += amount * 0.2;
                    totalCarbs += amount * 0.5;
                    totalFat += amount * 0.1;
                    totalCalories += (amount * 0.2 * 4) + (amount * 0.5 * 4) + (amount * 0.1 * 9);
                  }
                }
              });
            });
            
            // Calculate calories if not already calculated
            if (totalCalories === 0 && (totalProtein > 0 || totalCarbs > 0 || totalFat > 0)) {
              totalCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
            }
            
            // Calculate percentages
            const proteinPercent = totalCalories > 0 ? Math.round((totalProtein * 4 / totalCalories) * 100) : 30;
            const carbsPercent = totalCalories > 0 ? Math.round((totalCarbs * 4 / totalCalories) * 100) : 40;
            const fatPercent = totalCalories > 0 ? Math.round((totalFat * 9 / totalCalories) * 100) : 30;
            
            plans.push({
              id: workoutPlan.id,
              traineeId: trainee.id,
              traineeName: trainee.name,
              planName: workoutPlan.name || `${trainee.name} - תוכנית תזונה`,
              calorieTarget: Math.round(totalCalories) || 2500,
              protein: proteinPercent,
              carbs: carbsPercent,
              fat: fatPercent,
              createdAt: workoutPlan.created_at,
            });
          }
        }
      }
      
      setNutritionPlans(plans);
    } catch (error: any) {
      console.error("Error loading nutrition plans:", error);
      showToast("שגיאה בטעינת תוכניות התזונה: " + (error.message || "שגיאה לא ידועה"), "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  // Quick Stats
  const quickStats = useMemo(() => {
    const totalPlans = nutritionPlans.length;
    const activePlans = nutritionPlans.length; // All plans are active
    const avgCalories = nutritionPlans.length > 0
      ? Math.round(nutritionPlans.reduce((sum, p) => sum + p.calorieTarget, 0) / nutritionPlans.length)
      : 0;
    const avgProtein = nutritionPlans.length > 0
      ? Math.round(nutritionPlans.reduce((sum, p) => sum + p.protein, 0) / nutritionPlans.length)
      : 0;
    
    return { totalPlans, activePlans, avgCalories, avgProtein };
  }, [nutritionPlans]);

  // Filtered and sorted plans
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = [...nutritionPlans];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plan =>
        plan.traineeName.toLowerCase().includes(query) ||
        plan.planName.toLowerCase().includes(query)
      );
    }
    
    // Calorie filter
    if (calorieFilter !== 'all') {
      filtered = filtered.filter(plan => {
        if (calorieFilter === 'low') return plan.calorieTarget < 2000;
        if (calorieFilter === 'medium') return plan.calorieTarget >= 2000 && plan.calorieTarget < 3000;
        if (calorieFilter === 'high') return plan.calorieTarget >= 3000;
        return true;
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.planName.localeCompare(b.planName, 'he');
        case 'trainee':
          return a.traineeName.localeCompare(b.traineeName, 'he');
        case 'calories':
          return b.calorieTarget - a.calorieTarget;
        case 'date':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [nutritionPlans, searchQuery, calorieFilter, sortBy]);

  // Pie Chart Component
  const PieChartComponent = ({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) => {
    const size = 120;
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Normalize percentages to ensure they sum to 100
    const total = protein + carbs + fat;
    const normalizedProtein = total > 0 ? (protein / total) * 100 : 30;
    const normalizedCarbs = total > 0 ? (carbs / total) * 100 : 40;
    const normalizedFat = total > 0 ? (fat / total) * 100 : 30;
    
    // Convert percentages to angles
    const proteinAngle = (normalizedProtein / 100) * 360;
    const carbsAngle = (normalizedCarbs / 100) * 360;
    const fatAngle = (normalizedFat / 100) * 360;
    
    // Calculate start and end angles for each segment
    let currentAngle = -90; // Start from top
    
    const proteinStart = currentAngle;
    const proteinEnd = currentAngle + proteinAngle;
    currentAngle += proteinAngle;
    
    const carbsStart = currentAngle;
    const carbsEnd = currentAngle + carbsAngle;
    currentAngle += carbsAngle;
    
    const fatStart = currentAngle;
    const fatEnd = currentAngle + fatAngle;
    
    // Helper function to create arc path
    const createArc = (startAngle: number, endAngle: number) => {
      if (endAngle - startAngle >= 360) {
        // Full circle
        return `M ${centerX} ${centerY} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`;
      }
      const start = (startAngle * Math.PI) / 180;
      const end = (endAngle * Math.PI) / 180;
      const x1 = centerX + radius * Math.cos(start);
      const y1 = centerY + radius * Math.sin(start);
      const x2 = centerX + radius * Math.cos(end);
      const y2 = centerY + radius * Math.sin(end);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };
    
    return (
      <svg width={size} height={size} className="flex-shrink-0">
        {proteinAngle > 0 && (
          <path
            d={createArc(proteinStart, proteinEnd)}
            fill="#3b82f6"
          />
        )}
        {carbsAngle > 0 && (
          <path
            d={createArc(carbsStart, carbsEnd)}
            fill="#f97316"
          />
        )}
        {fatAngle > 0 && (
          <path
            d={createArc(fatStart, fatEnd)}
            fill="#ef4444"
          />
        )}
      </svg>
    );
  };

  // Skeleton Component
  const SkeletonNutritionPlanCard = () => (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
      <CardHeader className="p-5">
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, colorTheme }: { title: string; value: string | number; icon: any; colorTheme: 'blue' | 'indigo' | 'emerald' | 'orange' }) => {
    const themes = {
      blue: { 
        bg: "bg-gradient-to-br from-blue-500/80 to-blue-600/50 dark:from-blue-600/40 dark:to-blue-800/20", 
        text: "text-white dark:text-blue-100", 
        iconBg: "bg-white/20 dark:bg-blue-500/20",
      },
      indigo: { 
        bg: "bg-gradient-to-br from-indigo-500/80 to-indigo-600/50 dark:from-indigo-600/40 dark:to-indigo-800/20", 
        text: "text-white dark:text-indigo-100", 
        iconBg: "bg-white/20 dark:bg-indigo-500/20",
      },
      emerald: { 
        bg: "bg-gradient-to-br from-emerald-500/80 to-emerald-600/50 dark:from-emerald-600/40 dark:to-emerald-800/20", 
        text: "text-white dark:text-emerald-100", 
        iconBg: "bg-white/20 dark:bg-emerald-500/20",
      },
      orange: { 
        bg: "bg-gradient-to-br from-orange-500/80 to-orange-600/50 dark:from-orange-600/40 dark:to-orange-800/20", 
        text: "text-white dark:text-orange-100", 
        iconBg: "bg-white/20 dark:bg-orange-500/20",
      },
    };
    
    const theme = themes[colorTheme];

    return (
      <Card className={`relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all ${theme.bg} backdrop-blur-md`}>
        <CardContent className="p-4 sm:p-5 flex flex-col h-28 sm:h-32 justify-between">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <h3 className={`text-xs sm:text-sm font-medium ${theme.text} tracking-wide opacity-90`}>{title}</h3>
            <div className={`p-1.5 sm:p-2 rounded-xl ${theme.iconBg} ${theme.text} shadow-sm backdrop-blur-sm`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${theme.text} tracking-tight`}>
            {value}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-32" dir="rtl">
      {/* --- Page Header & Action --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">ניהול תוכניות תזונה</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">מאגר תזונה מקצועי למתאמנים</p>
        </div>
        <Link href="/trainer/nutrition-plans/new">
          <Button className="gap-2 shadow-sm rounded-xl h-10 px-4 sm:px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-none text-sm sm:text-base">
            <Plus className="h-4 w-4" />
            <span>צור תוכנית תזונה</span>
          </Button>
        </Link>
      </div>

      {/* --- Quick Stats --- */}
      {!loading && nutritionPlans.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="סה״כ תוכניות"
            value={quickStats.totalPlans}
            icon={PieChart}
            colorTheme="blue"
          />
          <StatCard
            title="תוכניות פעילות"
            value={quickStats.activePlans}
            icon={Target}
            colorTheme="indigo"
          />
          <StatCard
            title="ממוצע קלוריות"
            value={`${quickStats.avgCalories} קק״ל`}
            icon={TrendingUp}
            colorTheme="emerald"
          />
          <StatCard
            title="ממוצע חלבון"
            value={`${quickStats.avgProtein}%`}
            icon={Apple}
            colorTheme="orange"
          />
        </div>
      )}

      {/* --- Filters & Search --- */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש תוכנית תזונה..."
            className="pr-10 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 rounded-xl"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
              <Filter className="h-4 w-4 ml-2" />
              <span className="hidden sm:inline">פילטר קלוריות</span>
              <span className="sm:hidden">פילטר</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setCalorieFilter('all')}>
              הכל
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCalorieFilter('low')}>
              נמוך (&lt;2000 קק״ל)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCalorieFilter('medium')}>
              בינוני (2000-3000 קק״ל)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCalorieFilter('high')}>
              גבוה (&gt;3000 קק״ל)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <span className="hidden sm:inline">מיון</span>
              <span className="sm:hidden">מיון</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setSortBy('name')}>
              לפי שם
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('trainee')}>
              לפי מתאמן
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('calories')}>
              לפי קלוריות
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('date')}>
              לפי תאריך
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- Nutrition Plans Grid --- */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonNutritionPlanCard key={i} />
          ))}
        </div>
      ) : filteredAndSortedPlans.length === 0 ? (
        <div className="col-span-full">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
            <CardContent className="p-12 sm:p-16 text-center flex flex-col items-center justify-center gap-4 sm:gap-6">
              <div className="p-4 sm:p-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <PieChart className="h-12 w-12 sm:h-16 sm:w-16" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {searchQuery || calorieFilter !== 'all' ? "לא נמצאו תוכניות תזונה" : "אין תוכניות תזונה עדיין"}
                </p>
                <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mt-2">
                  {searchQuery || calorieFilter !== 'all' 
                    ? "נסה לשנות את החיפוש או הפילטרים" 
                    : "התחל ליצור תוכניות תזונה מקצועיות למתאמנים שלך"}
                </p>
              </div>
              {!searchQuery && calorieFilter === 'all' && (
                <Link href="/trainer/nutrition-plans/new">
                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl">
                    <Plus className="h-4 w-4 ml-2" />
                    צור תוכנית תזונה ראשונה
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl hover:shadow-md transition-all"
            >
              <CardHeader className="p-4 sm:p-5">
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{plan.planName}</CardTitle>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">{plan.traineeName}</p>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-5 pt-0">
                {/* Calorie Target */}
                <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-600/20 dark:to-blue-800/10 rounded-xl p-3 sm:p-4 border border-blue-200/50 dark:border-blue-500/20">
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1.5 font-medium uppercase tracking-wider">יעד קלורי:</p>
                  <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{plan.calorieTarget} קק"ל</p>
                </div>

                {/* Pie Chart and Macros */}
                <div className="flex items-center gap-3 sm:gap-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl p-3 sm:p-4">
                  <PieChartComponent 
                    protein={plan.protein} 
                    carbs={plan.carbs} 
                    fat={plan.fat} 
                  />
                  <div className="flex-1 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-lg bg-blue-500"></div>
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-bold">חלבון: {plan.protein}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-lg bg-orange-500"></div>
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-bold">פחמימות: {plan.carbs}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-lg bg-red-500"></div>
                      <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-bold">שומן: {plan.fat}%</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/trainer/nutrition-plans/${plan.traineeId}/edit`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full h-10 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all text-sm"
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      ערוך
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="h-10 w-10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold rounded-xl transition-all p-0"
                    onClick={() => {
                      if (confirm("האם אתה בטוח שברצונך למחוק תוכנית תזונה זו?")) {
                        showToast("מחיקת תוכנית תזונה - יושם בהמשך", "info", 3000);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NutritionPlansPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <NutritionPlansContent />
    </ProtectedRoute>
  );
}

