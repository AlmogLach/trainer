"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Save, Plus, X, Loader2, Apple, Trash2, Edit, Search, History
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getTrainerTrainees, getActiveWorkoutPlan, createWorkoutPlan, updateWorkoutPlan, getFoodHistory, type FoodHistoryItem } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { User, NutritionMenu } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

function NewNutritionPlanContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainees, setTrainees] = useState<User[]>([]);
  
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>("");
  const [planName, setPlanName] = useState("");
  const [calorieTarget, setCalorieTarget] = useState(2500);
  const [proteinPercent, setProteinPercent] = useState(30);
  const [carbsPercent, setCarbsPercent] = useState(40);
  const [fatPercent, setFatPercent] = useState(30);
  
  const [meals, setMeals] = useState<Array<{
    id: string;
    mealName: string;
    foods: Array<{
      id: string;
      foodName: string;
      amount: string;
    }>;
  }>>([
    { id: "1", mealName: "ארוחת בוקר", foods: [] },
  ]);
  
  const [editingMealName, setEditingMealName] = useState<Record<string, string>>({});
  const [foodHistory, setFoodHistory] = useState<FoodHistoryItem[]>([]);
  const [loadingFoodHistory, setLoadingFoodHistory] = useState(false);
  const [showFoodHistory, setShowFoodHistory] = useState(false);
  const [selectedMealForFood, setSelectedMealForFood] = useState<string | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadTrainees();
    }
  }, [trainerId]);

  useEffect(() => {
    // Ensure percentages sum to 100
    const total = proteinPercent + carbsPercent + fatPercent;
    if (total !== 100) {
      const diff = 100 - total;
      setFatPercent(prev => prev + diff);
    }
  }, [proteinPercent, carbsPercent]);

  useEffect(() => {
    if (selectedTraineeId) {
      loadFoodHistory();
    } else {
      setFoodHistory([]);
    }
  }, [selectedTraineeId]);

  const loadTrainees = async () => {
    try {
      setLoading(true);
      const traineesList = await getTrainerTrainees(trainerId);
      setTrainees(traineesList);
    } catch (error: any) {
      console.error("Error loading trainees:", error);
    } finally {
      setLoading(false);
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
    setEditingMealName(prev => {
      const updated = { ...prev };
      delete updated[mealId];
      return updated;
    });
  };

  const startEditingMealName = (mealId: string, currentName: string) => {
    setEditingMealName(prev => ({ ...prev, [mealId]: currentName }));
  };

  const loadFoodHistory = async () => {
    if (!selectedTraineeId) return;
    
    try {
      setLoadingFoodHistory(true);
      const history = await getFoodHistory(selectedTraineeId);
      setFoodHistory(history);
    } catch (error: any) {
      console.error("Error loading food history:", error);
    } finally {
      setLoadingFoodHistory(false);
    }
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

  const filteredFoodHistory = foodHistory.filter(food =>
    food.foodName.toLowerCase().includes(foodSearchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedTraineeId) {
      showToast("אנא בחר מתאמן", "warning", 3000);
      return;
    }

    if (!planName.trim()) {
      showToast("אנא הזן שם לתוכנית", "warning", 3000);
      return;
    }

    if (proteinPercent + carbsPercent + fatPercent !== 100) {
      showToast("סכום האחוזים של המקרונוטריינטים חייב להיות 100%", "warning", 4000);
      return;
    }

    try {
      setSaving(true);

      // Ensure workout plan exists
      let workoutPlan = await getActiveWorkoutPlan(selectedTraineeId);
      
      if (!workoutPlan) {
        // Create a new workout plan
        workoutPlan = await createWorkoutPlan({
          trainee_id: selectedTraineeId,
          trainer_id: trainerId,
          name: planName,
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          weekly_target_workouts: 5,
        });
      } else {
        // Update existing plan name if it changed
        if (workoutPlan.name !== planName) {
          await updateWorkoutPlan(workoutPlan.id, { name: planName });
        }
      }

      // Create nutrition menu
      const nutritionMenu: NutritionMenu = {
        meals: meals.map(meal => ({
          id: meal.id,
          mealName: meal.mealName,
          foods: meal.foods.filter(f => f.foodName.trim() && f.amount.trim())
        }))
      };

      // Save nutrition menu - use the plan ID directly
      const { error } = await supabase
        .from('workout_plans')
        .update({ nutrition_menu: nutritionMenu as any })
        .eq('id', workoutPlan.id);

      if (error) {
        // If column doesn't exist, inform user to run migration
        if (error.code === '42703' || error.message?.includes('column')) {
          throw new Error('nutrition_menu column does not exist. Please run the migration to add it first.');
        }
        throw error;
      }

      // Redirect to nutrition plans page
      showToast("תוכנית התזונה נשמרה בהצלחה!", "success", 3000);
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
          <p className="text-base font-bold text-gray-900 dark:text-white">טוען נתונים...</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">מכין את יצירת תוכנית התזונה</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-32" dir="rtl">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <Link href="/trainer/nutrition-plans">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">צור תוכנית תזונה חדשה</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">בנה תוכנית תזונה מותאמת אישית</p>
            </div>
          </div>
        </div>

        {/* Basic Info Card */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">פרטים בסיסיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-sm text-gray-900 dark:text-white mb-2 block font-bold">בחר מתאמן:</label>
              <select
                value={selectedTraineeId}
                onChange={(e) => setSelectedTraineeId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
              >
                <option value="">בחר מתאמן...</option>
                {trainees.map(trainee => (
                  <option key={trainee.id} value={trainee.id}>
                    {trainee.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-900 dark:text-white mb-2 block font-bold">שם התוכנית:</label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="לדוגמה: חיטוב מתקדם"
                className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="text-sm text-gray-900 dark:text-white mb-2 block font-bold">יעד קלורי (קק"ל):</label>
              <Input
                type="number"
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(parseInt(e.target.value) || 2500)}
                className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
              />
            </div>

            {/* Macronutrient Distribution */}
            <div>
              <label className="text-sm text-gray-900 dark:text-white mb-2 block font-bold">חלוקת מקרונוטריינטים:</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">חלבון (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={proteinPercent}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const remaining = 100 - value - carbsPercent;
                      setProteinPercent(value);
                      if (remaining >= 0 && remaining <= 100) {
                        setFatPercent(remaining);
                      }
                    }}
                    className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">פחמימות (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={carbsPercent}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const remaining = 100 - proteinPercent - value;
                      setCarbsPercent(value);
                      if (remaining >= 0 && remaining <= 100) {
                        setFatPercent(remaining);
                      }
                    }}
                    className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">שומן (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={fatPercent}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const remaining = 100 - proteinPercent - carbsPercent;
                      setFatPercent(value);
                      if (remaining >= 0 && remaining <= 100) {
                        setCarbsPercent(remaining);
                      }
                    }}
                    className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-400"></div>
                  <span className="text-gray-900 dark:text-white font-bold">חלבון: {proteinPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500 dark:bg-orange-400"></div>
                  <span className="text-gray-900 dark:text-white font-bold">פחמימות: {carbsPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500 dark:bg-red-400"></div>
                  <span className="text-gray-900 dark:text-white font-bold">שומן: {fatPercent}%</span>
                </div>
                <span className={`text-xs font-bold ${proteinPercent + carbsPercent + fatPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  סה"כ: {proteinPercent + carbsPercent + fatPercent}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals Card */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                <Apple className="h-5 w-5" />
                ארוחות ומזונות
              </CardTitle>
              <Button
                onClick={addMeal}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm"
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף ארוחה
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {meals.map((meal) => (
              <div key={meal.id} className="border border-gray-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                  {editingMealName[meal.id] !== undefined ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingMealName[meal.id]}
                        onChange={(e) => setEditingMealName(prev => ({ ...prev, [meal.id]: e.target.value }))}
                        onBlur={() => {
                          if (editingMealName[meal.id]?.trim()) {
                            updateMealName(meal.id, editingMealName[meal.id].trim());
                          } else {
                            setEditingMealName(prev => {
                              const updated = { ...prev };
                              delete updated[meal.id];
                              return updated;
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingMealName[meal.id]?.trim()) {
                              updateMealName(meal.id, editingMealName[meal.id].trim());
                            }
                          } else if (e.key === 'Escape') {
                            setEditingMealName(prev => {
                              const updated = { ...prev };
                              delete updated[meal.id];
                              return updated;
                            });
                          }
                        }}
                        autoFocus
                        className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white flex-1 max-w-xs rounded-xl"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editingMealName[meal.id]?.trim()) {
                            updateMealName(meal.id, editingMealName[meal.id].trim());
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl"
                      >
                        שמור
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingMealName(prev => {
                            const updated = { ...prev };
                            delete updated[meal.id];
                            return updated;
                          });
                        }}
                        className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 
                        className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => startEditingMealName(meal.id, meal.mealName)}
                      >
                        {meal.mealName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingMealName(meal.id, meal.mealName)}
                          className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {meals.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMeal(meal.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMealForFood(meal.id);
                              setShowFoodHistory(true);
                            }}
                            className="border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                            title="הוסף מהיסטוריה"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addFoodToMeal(meal.id)}
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm"
                          >
                            <Plus className="h-4 w-4 ml-2" />
                            הוסף מזון
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {meal.foods.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">אין מזונות בארוחה זו</p>
                ) : (
                  <div className="space-y-3">
                    {meal.foods.map((food) => (
                      <div key={food.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-900 dark:text-white mb-1 block font-medium">שם המזון:</label>
                            <Input
                              value={food.foodName}
                              onChange={(e) => updateFood(meal.id, food.id, "foodName", e.target.value)}
                              placeholder="לדוגמה: חזה עוף"
                              className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white text-sm rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-900 dark:text-white mb-1 block font-medium">כמות (גרם):</label>
                            <Input
                              type="number"
                              value={food.amount}
                              onChange={(e) => updateFood(meal.id, food.id, "amount", e.target.value)}
                              placeholder="200"
                              className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white text-sm rounded-xl"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFoodFromMeal(meal.id, food.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3 sm:gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || !selectedTraineeId || !planName.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                שמור תוכנית תזונה
              </>
            )}
          </Button>
          <Link href="/trainer/nutrition-plans">
            <Button
              variant="outline"
              className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl shadow-sm"
            >
              ביטול
            </Button>
          </Link>
        </div>
      </div>

      {/* Food History Sidebar */}
      <aside className={`
        ${showFoodHistory ? 'flex' : 'hidden'} lg:flex
        lg:w-80 flex-col bg-white dark:bg-slate-900/50 border-l border-gray-200 dark:border-slate-800
        fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5" />
            היסטוריית מזונות
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
            onClick={() => {
              setShowFoodHistory(false);
              setSelectedMealForFood(null);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-slate-400" />
            <Input
              value={foodSearchQuery}
              onChange={(e) => setFoodSearchQuery(e.target.value)}
              placeholder="חפש מזון..."
              className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white pr-10 rounded-xl"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingFoodHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : selectedMealForFood ? (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">מוסיף לארוחה:</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {meals.find(m => m.id === selectedMealForFood)?.mealName || ''}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedMealForFood(null);
                  setShowFoodHistory(false);
                }}
                className="mt-2 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white h-6 px-2"
              >
                <X className="h-3 w-3 ml-1" />
                ביטול בחירה
              </Button>
            </div>
          ) : null}
          
          {filteredFoodHistory.length === 0 && !loadingFoodHistory ? (
            <div className="text-center text-gray-500 py-8">
              {selectedTraineeId ? "אין היסטוריית מזונות" : "בחר מתאמן כדי לראות היסטוריה"}
            </div>
          ) : (
            filteredFoodHistory.map((food, index) => (
              <div
                key={`${food.foodName}-${index}`}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer border border-gray-200 dark:border-slate-800"
                onClick={() => {
                  if (selectedMealForFood) {
                    addFoodFromHistory(selectedMealForFood, food);
                  } else if (meals.length > 0) {
                    // Auto-select first meal if none selected
                    addFoodFromHistory(meals[0].id, food);
                  }
                }}
              >
                <Apple className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white text-sm">{food.foodName}</p>
                  {food.amount && (
                    <p className="text-gray-500 dark:text-slate-400 text-xs">כמות: {food.amount} גרם</p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedMealForFood) {
                      addFoodFromHistory(selectedMealForFood, food);
                    } else if (meals.length > 0) {
                      addFoodFromHistory(meals[0].id, food);
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

export default function NewNutritionPlanPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <NewNutritionPlanContent />
    </ProtectedRoute>
  );
}

