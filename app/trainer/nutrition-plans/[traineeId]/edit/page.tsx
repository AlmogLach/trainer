"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Save, Plus, Loader2, Apple
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  getActiveWorkoutPlan, 
  getNutritionMenu, 
  updateWorkoutPlan, 
  getFoodHistory, 
  type FoodHistoryItem 
} from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { NutritionMenu } from "@/lib/types";
import { MealCard, type Meal } from "@/components/trainer/nutrition/MealCard";
import { FoodHistorySidebar } from "@/components/trainer/nutrition/FoodHistorySidebar";
import { MacrosDistribution } from "@/components/trainer/nutrition/MacrosDistribution";
import { useToast } from "@/components/ui/toast";

function EditNutritionPlanContent() {
  const params = useParams();
  const router = useRouter();
  const traineeId = params.traineeId as string;
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planName, setPlanName] = useState("");
  const [calorieTarget, setCalorieTarget] = useState(2500);
  const [proteinPercent, setProteinPercent] = useState(30);
  const [carbsPercent, setCarbsPercent] = useState(40);
  const [fatPercent, setFatPercent] = useState(30);
  
  const [meals, setMeals] = useState<Meal[]>([]);
  
  const [foodHistory, setFoodHistory] = useState<FoodHistoryItem[]>([]);
  const [loadingFoodHistory, setLoadingFoodHistory] = useState(false);
  const [showFoodHistory, setShowFoodHistory] = useState(false);
  const [selectedMealForFood, setSelectedMealForFood] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [workoutPlanId, setWorkoutPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (traineeId && user?.id) {
      loadNutritionPlan();
      loadFoodHistory();
    }
  }, [traineeId, user?.id]);

  const loadNutritionPlan = async () => {
    try {
      setLoading(true);
      
      const workoutPlan = await getActiveWorkoutPlan(traineeId);
      if (!workoutPlan) {
        showToast("לא נמצאה תוכנית תזונה למתאמן זה", "error", 4000);
        router.push("/trainer/nutrition-plans");
        return;
      }

      setWorkoutPlanId(workoutPlan.id);
      setPlanName(workoutPlan.name || "");

      const nutritionMenu = await getNutritionMenu(traineeId);
      if (nutritionMenu && nutritionMenu.meals) {
        setMeals(nutritionMenu.meals);
      } else {
        // If no menu exists, start with one empty meal
        setMeals([{ id: "1", mealName: "ארוחת בוקר", foods: [] }]);
      }
    } catch (error: any) {
      console.error("Error loading nutrition plan:", error);
      showToast("שגיאה בטעינת תוכנית התזונה: " + error.message, "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  const loadFoodHistory = async () => {
    if (!traineeId) return;
    
    try {
      setLoadingFoodHistory(true);
      const history = await getFoodHistory(traineeId);
      setFoodHistory(history);
    } catch (error: any) {
      console.error("Error loading food history:", error);
    } finally {
      setLoadingFoodHistory(false);
    }
  };

  const addFoodToMeal = (mealId: string) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? {
            ...meal,
            foods: [...meal.foods, {
              id: `food-${Date.now()}-${Math.random()}`,
              foodName: "",
              amount: ""
            }]
          }
        : meal
    ));
  };

  const removeFoodFromMeal = (mealId: string, foodId: string) => {
    setMeals(prev => prev.map(meal =>
      meal.id === mealId
        ? {
            ...meal,
            foods: meal.foods.filter(f => f.id !== foodId)
          }
        : meal
    ));
  };

  const updateFood = (mealId: string, foodId: string, field: "foodName" | "amount", value: string) => {
    setMeals(prev => prev.map(meal =>
      meal.id === mealId
        ? {
            ...meal,
            foods: meal.foods.map(food =>
              food.id === foodId
                ? { ...food, [field]: value }
                : food
            )
          }
        : meal
    ));
  };

  const addMeal = () => {
    setMeals(prev => [...prev, {
      id: `meal-${Date.now()}`,
      mealName: "ארוחה חדשה",
      foods: []
    }]);
  };

  const removeMeal = (mealId: string) => {
    if (meals.length <= 1) {
      showToast("חייב להיות לפחות ארוחה אחת", "warning", 3000);
      return;
    }
    setMeals(prev => prev.filter(meal => meal.id !== mealId));
  };

  const updateMealName = (mealId: string, newName: string) => {
    setMeals(prev => prev.map(meal =>
      meal.id === mealId
        ? { ...meal, mealName: newName }
        : meal
    ));
  };

  const addFoodFromHistory = (mealId: string, food: FoodHistoryItem) => {
    setMeals(prev => prev.map(meal => 
      meal.id === mealId 
        ? {
            ...meal,
            foods: [...meal.foods, {
              id: `food-${Date.now()}-${Math.random()}`,
              foodName: food.foodName,
              amount: food.amount || ""
            }]
          }
        : meal
    ));
    setSelectedMealForFood(null);
    setShowFoodHistory(false);
  };

  const selectedMealName = selectedMealForFood 
    ? meals.find(m => m.id === selectedMealForFood)?.mealName || null
    : null;

  const handleSave = async () => {
    if (!planName.trim()) {
      showToast("אנא הזן שם לתוכנית", "warning", 3000);
      return;
    }

    if (proteinPercent + carbsPercent + fatPercent !== 100) {
      showToast("סכום האחוזים של המקרונוטריינטים חייב להיות 100%", "warning", 4000);
      return;
    }

    if (!workoutPlanId) {
      showToast("שגיאה: לא נמצא מזהה תוכנית", "error", 4000);
      return;
    }

    try {
      setSaving(true);

      // Update plan name
      await updateWorkoutPlan(workoutPlanId, { name: planName });

      // Create nutrition menu
      const nutritionMenu: NutritionMenu = {
        meals: meals.map(meal => ({
          id: meal.id,
          mealName: meal.mealName,
          foods: meal.foods.filter(f => f.foodName.trim() && f.amount.trim())
        }))
      };

      // Save nutrition menu
      const { error } = await supabase
        .from('workout_plans')
        .update({ nutrition_menu: nutritionMenu as any })
        .eq('id', workoutPlanId);

      if (error) {
        // If column doesn't exist, inform user to run migration
        if (error.code === '42703' || error.message?.includes('column')) {
          throw new Error('nutrition_menu column does not exist. Please run the migration to add it first.');
        }
        throw error;
      }

      // Redirect to nutrition plans page
      router.push("/trainer/nutrition-plans");
    } catch (error: any) {
      console.error("Error saving nutrition plan:", error);
      showToast("שגיאה בשמירת תוכנית התזונה: " + (error.message || error.toString()), "error", 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] w-full flex flex-col items-center justify-center gap-6">
        <div className="relative">
          {/* Outer pulsing circle */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 dark:bg-blue-500/10 animate-ping" />
          {/* Middle pulsing circle */}
          <div className="absolute inset-2 rounded-full bg-blue-500/30 dark:bg-blue-500/20 animate-pulse" />
          {/* Spinner */}
          <div className="relative">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 h-16 w-16" strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-base font-bold text-gray-900 dark:text-white">טוען תוכנית תזונה...</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">מכין את עורך התזונה</p>
        </div>
        {/* Loading dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-5 lg:p-6 pb-32" dir="rtl">
      <div className="max-w-7xl mx-auto flex gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800 mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
            <Link href="/trainer/nutrition-plans">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              </Button>
            </Link>
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">FitLog Nutrition Editor</p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">ערוך תוכנית תזונה</h1>
            </div>
          </div>
        </div>

        {/* Content with padding */}
        <div className="space-y-4 sm:space-y-6">
        {/* Enhanced Basic Info Card */}
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-2xl">
                <Apple className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white text-xl sm:text-2xl font-black">פרטים בסיסיים</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-slate-400 mb-2 block font-bold uppercase tracking-wider">שם התוכנית:</label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="לדוגמה: חיטוב מתקדם"
                className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-11 sm:h-12 font-medium focus:border-blue-600 dark:focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-slate-400 mb-2 block font-bold uppercase tracking-wider">יעד קלורי (קק"ל):</label>
              <Input
                type="number"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(parseInt(e.target.value) || 2500)}
                className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-11 sm:h-12 font-medium focus:border-blue-600 dark:focus:border-blue-500 transition-all"
              />
            </div>

            <MacrosDistribution
              proteinPercent={proteinPercent}
              carbsPercent={carbsPercent}
              fatPercent={fatPercent}
              onProteinChange={setProteinPercent}
              onCarbsChange={setCarbsPercent}
              onFatChange={setFatPercent}
            />
          </CardContent>
        </Card>

        {/* Enhanced Meals Card */}
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-2xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-2xl">
                  <Apple className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-gray-900 dark:text-white text-xl sm:text-2xl font-black">ארוחות ומזונות</CardTitle>
                {meals.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 px-2 sm:px-3 py-1 rounded-lg border border-orange-200 dark:border-orange-800">
                    <span className="text-orange-600 dark:text-orange-400 font-black text-xs sm:text-sm">{meals.length}</span>
                    <span className="text-gray-500 dark:text-slate-400 text-xs mr-1">ארוחות</span>
                  </div>
                )}
              </div>
              <Button
                onClick={addMeal}
                className="h-10 sm:h-11 px-4 sm:px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                הוסף ארוחה
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                isOnlyMeal={meals.length === 1}
                onUpdateName={updateMealName}
                onAddFood={addFoodToMeal}
                onRemoveFood={removeFoodFromMeal}
                onUpdateFood={updateFood}
                onRemove={removeMeal}
                onOpenFoodHistory={(mealId) => {
                  setSelectedMealForFood(mealId);
                  setShowFoodHistory(true);
                }}
              />
            ))}
          </CardContent>
        </Card>

        {/* Enhanced Save Button */}
        <div className="flex gap-3 sm:gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || !planName.trim()}
            className="flex-1 h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 text-base sm:text-lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-6 w-6 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="h-6 w-6 ml-2" />
                שמור שינויים
              </>
            )}
          </Button>
          <Link href="/trainer/nutrition-plans">
            <Button
              variant="outline"
              className="h-12 sm:h-14 px-6 sm:px-8 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-xl shadow-sm transition-all active:scale-95"
            >
              ביטול
            </Button>
          </Link>
        </div>
      </div>

      {/* Food History Sidebar */}
      <div className={`${showFoodHistory ? 'flex' : 'hidden'} lg:flex lg:w-80`}>
        <FoodHistorySidebar
          foodHistory={foodHistory}
          loading={loadingFoodHistory}
          searchQuery={foodSearchQuery}
          onSearchChange={setFoodSearchQuery}
          selectedMealId={selectedMealForFood}
          mealName={selectedMealName}
          onAddFood={(food) => {
            if (selectedMealForFood) {
              addFoodFromHistory(selectedMealForFood, food);
            } else if (meals.length > 0) {
              addFoodFromHistory(meals[0].id, food);
            }
          }}
          onClose={() => {
            setShowFoodHistory(false);
            setSelectedMealForFood(null);
          }}
          onCancelSelection={() => {
            setSelectedMealForFood(null);
          }}
        />
        </div>
      </div>
      </div>
    </div>
  );
}

export default function EditNutritionPlanPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <EditNutritionPlanContent />
    </ProtectedRoute>
  );
}

