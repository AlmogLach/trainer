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

function EditNutritionPlanContent() {
  const params = useParams();
  const router = useRouter();
  const traineeId = params.traineeId as string;
  const { user } = useAuth();
  
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
        alert("לא נמצאה תוכנית תזונה למתאמן זה");
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
      alert("שגיאה בטעינת תוכנית התזונה: " + error.message);
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
      alert("חייב להיות לפחות ארוחה אחת");
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
      alert("אנא הזן שם לתוכנית");
      return;
    }

    if (proteinPercent + carbsPercent + fatPercent !== 100) {
      alert("סכום האחוזים של המקרונוטריינטים חייב להיות 100%");
      return;
    }

    if (!workoutPlanId) {
      alert("שגיאה: לא נמצא מזהה תוכנית");
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
      alert("שגיאה בשמירת תוכנית התזונה: " + (error.message || error.toString()));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] p-4 lg:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/trainer/nutrition-plans">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">ערוך תוכנית תזונה</h1>
          </div>
        </div>

        {/* Basic Info Card */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">פרטים בסיסיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">שם התוכנית:</label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="לדוגמה: חיטוב מתקדם"
                className="bg-[#0f1a2a] border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">יעד קלורי (קק"ל):</label>
              <Input
                type="number"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(parseInt(e.target.value) || 2500)}
                className="bg-[#0f1a2a] border-gray-700 text-white"
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

        {/* Meals Card */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Apple className="h-5 w-5" />
                ארוחות ומזונות
              </CardTitle>
              <Button
                onClick={addMeal}
                className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף ארוחה
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || !planName.trim()}
            className="flex-1 bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                שמור שינויים
              </>
            )}
          </Button>
          <Link href="/trainer/nutrition-plans">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
  );
}

export default function EditNutritionPlanPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <EditNutritionPlanContent />
    </ProtectedRoute>
  );
}

