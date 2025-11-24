"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Apple, Beef, Home, BarChart3, Users, Target, Settings, Edit, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getNutritionMenu, getNutritionSwaps } from "@/lib/db";
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

function NutritionCalculatorContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sourceFood, setSourceFood] = useState<FoodItem | null>(null);
  const [sourceAmount, setSourceAmount] = useState<string>("100");
  const [targetFood, setTargetFood] = useState<FoodItem | null>(null);
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      const [menu, swaps] = await Promise.all([
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
          alert(`שגיאה בטעינת המזונות: ${err.message || 'לא ניתן לטעון את המזונות. אנא בדוק את הגדרות RLS.'}`);
          return []; // Return empty array if error
        })
      ]);
      
      setNutritionMenu(menu || { meals: [] });
      
      // Convert swaps to FoodItem format
      const formattedSwaps = Array.isArray(swaps) ? swaps.map(convertSwapToFoodItem) : [];
      setFoodDatabase(formattedSwaps);
      
      console.log(`Loaded ${formattedSwaps.length} foods into database`);
      
      if (formattedSwaps.length === 0) {
        console.warn('No nutrition swaps found in database. Please add foods to nutrition_swaps table or check RLS policies.');
      }
    } catch (error: any) {
      console.error('Error loading nutrition data:', error);
      setNutritionMenu({ meals: [] });
      setFoodDatabase([]);
      // Show error to user
      alert(`שגיאה בטעינת נתוני התזונה: ${error.message || 'שגיאה לא ידועה'}`);
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

  return (
    <div className="min-h-screen bg-[#0a1628] pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-[#1a2332] text-white p-4 sticky top-0 z-10 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link href="/trainee/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold">מחשבון המרות תזונה</h1>
            <p className="text-xs text-gray-400 mt-1">גוון את התזונה שלך עם המרות מדויקות</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Nutrition Menu Card */}
        <NutritionMenuCard menu={nutritionMenu} variant="dark" />

        {/* Food Comparison Cards */}
        <div className="grid grid-cols-2 gap-4">
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
          <Card className="bg-[#1a2332] border-gray-800">
            <CardContent className="p-6 space-y-5">
              {/* Protein */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">חלבון ({proteinCurrent.toFixed(0)} / {proteinTarget.toFixed(0)})</span>
                </div>
                <div className="relative h-4 bg-[#0f1a2a] rounded-full overflow-hidden">
                  {proteinCurrent <= proteinTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full transition-all"
                        style={{ width: `${(proteinCurrent / proteinTarget) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((proteinTarget - proteinCurrent) / proteinTarget) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full"
                        style={{ width: `${(proteinTarget / proteinCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((proteinCurrent - proteinTarget) / proteinCurrent) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>

              {/* Carbohydrates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">פחמימות ({carbsCurrent.toFixed(0)} / {carbsTarget.toFixed(0)})</span>
                </div>
                <div className="relative h-4 bg-[#0f1a2a] rounded-full overflow-hidden">
                  {carbsCurrent <= carbsTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full transition-all"
                        style={{ width: `${(carbsCurrent / (carbsTarget || 1)) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((carbsTarget - carbsCurrent) / (carbsTarget || 1)) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full"
                        style={{ width: `${(carbsTarget / carbsCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((carbsCurrent - carbsTarget) / carbsCurrent) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>

              {/* Fat */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">שומן ({fatCurrent.toFixed(1)} / {fatTarget.toFixed(1)})</span>
                </div>
                <div className="relative h-4 bg-[#0f1a2a] rounded-full overflow-hidden">
                  {fatCurrent <= fatTarget ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full transition-all"
                        style={{ width: `${(fatCurrent / fatTarget) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
                        style={{ width: `${((fatTarget - fatCurrent) / fatTarget) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full bg-[#00ff88] rounded-full"
                        style={{ width: `${(fatTarget / fatCurrent) * 100}%` }}
                      ></div>
                      <div
                        className="absolute left-0 top-0 h-full bg-orange-500 rounded-full"
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
          <Card className="bg-[#1a2332] border-gray-800 border-2 border-[#00ff88]/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">תוצאות ההמרה (בערך)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main conversion info */}
              <div className="bg-[#0f1a2a] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">מקור:</span>
                  <span className="text-white font-semibold">
                    {sourceAmount} גרם {sourceFood.name}
                  </span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <span className="text-[#00ff88] text-xl">⇄</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">יעד (כמות משוערת):</span>
                  <span className="text-[#00ff88] font-bold text-lg">
                    ~{targetAmount} גרם {targetFood.name}
                  </span>
                </div>
                <p className="text-gray-500 text-xs text-center mt-2">
                  * הכמות משוערת - ערכים דומים, לא זהים בדיוק
                </p>
              </div>

              {/* Macros comparison */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#0f1a2a] rounded p-2">
                  <div className="text-gray-400 text-xs mb-1">חלבון</div>
                  <div className="text-white font-semibold">
                    {targetMacros.protein.toFixed(1)} גרם
                    {Math.abs(macroDiffs.protein) > 2 && (
                      <span className={`text-xs ml-1 ${macroDiffs.protein > 0 ? 'text-yellow-400' : 'text-yellow-400'}`}>
                        ({macroDiffs.protein > 0 ? '+' : ''}{macroDiffs.protein.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-[#0f1a2a] rounded p-2">
                  <div className="text-gray-400 text-xs mb-1">פחמימות</div>
                  <div className="text-white font-semibold">
                    {targetMacros.carbs.toFixed(1)} גרם
                    {Math.abs(macroDiffs.carbs) > 5 && (
                      <span className={`text-xs ml-1 ${macroDiffs.carbs > 0 ? 'text-yellow-400' : 'text-yellow-400'}`}>
                        ({macroDiffs.carbs > 0 ? '+' : ''}{macroDiffs.carbs.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-[#0f1a2a] rounded p-2">
                  <div className="text-gray-400 text-xs mb-1">שומן</div>
                  <div className="text-white font-semibold">
                    {targetMacros.fat.toFixed(1)} גרם
                    {Math.abs(macroDiffs.fat) > 2 && (
                      <span className={`text-xs ml-1 ${macroDiffs.fat > 0 ? 'text-yellow-400' : 'text-yellow-400'}`}>
                        ({macroDiffs.fat > 0 ? '+' : ''}{macroDiffs.fat.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-[#0f1a2a] rounded p-2">
                  <div className="text-gray-400 text-xs mb-1">קלוריות</div>
                  <div className="text-white font-semibold">
                    {targetMacros.calories.toFixed(0)} קק"ל
                    {Math.abs(macroDiffs.calories) > 20 && (
                      <span className={`text-xs ml-1 ${macroDiffs.calories > 0 ? 'text-yellow-400' : 'text-yellow-400'}`}>
                        ({macroDiffs.calories > 0 ? '+' : ''}{macroDiffs.calories.toFixed(0)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match quality */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-gray-400">קרבה לערכים המקוריים:</span>
                <span className={`font-semibold ${
                  matchQuality.color === 'green' ? 'text-[#00ff88]' :
                  matchQuality.color === 'yellow' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {matchQuality.text}
                </span>
              </div>
              {matchQuality.color === 'green' && (
                <p className="text-gray-500 text-xs text-center">
                  ✓ התאמה טובה - ערכים דומים למקור
                </p>
              )}
              {matchQuality.color === 'yellow' && (
                <p className="text-yellow-400 text-xs text-center">
                  ⚠ התאמה סבירה - יש הבדל קטן בערכים
                </p>
              )}
              {matchQuality.color === 'red' && (
                <p className="text-red-400 text-xs text-center">
                  ⚠ התאמה נמוכה - הבדל משמעותי בערכים
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* FoodsDictionary Search Box */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">חיפוש מזונות - FoodsDictionary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
                    className="flex-1 px-4 py-2 bg-[#0f1a2a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff88]"
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
                    className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold px-6"
                  >
                    חיפוש
                  </Button>
                </div>
              </form>
            </div>
            <p className="text-gray-500 text-xs text-center mt-3">
              השתמש בחיפוש זה כדי למצוא ערכים תזונתיים מדויקים למזונות שונים
            </p>
          </CardContent>
        </Card>

        {/* Info Card - This is just a calculator, not a logger */}
        {sourceFood && targetFood && sourceAmount && targetAmount && (
          <Card className="bg-[#1a2332] border-gray-800">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <p className="text-white text-sm">
                  💡 <strong>מחשבון המרות</strong> - עוזר לך לגוון את התזונה
                </p>
                <p className="text-gray-400 text-xs">
                  השתמש במידע הזה כדי להחליף מזונות בתפריט שלך
                </p>
                {matchQuality.score < 0.3 && (
                  <p className="text-yellow-400 text-xs mt-2">
                    ⚠️ התאמה {matchQuality.text} - ייתכן שיהיה צורך להתאים את הכמות
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Food Picker Modals */}
      {showSourcePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSourcePicker(false)}>
          <Card className="bg-[#1a2332] border-gray-800 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-white">בחר מזון מקור</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#00ff88]" />
                </div>
              ) : foodDatabase.length === 0 ? (
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
                      <p className="text-xs text-gray-500 mb-2 px-2">מהתפריט שלך:</p>
                      {menuFoods.map((menuFood, index) => {
                        const food = foodDatabase.find(f => f.name === menuFood.name);
                        if (!food) return null;
                        return (
                          <button
                            key={`menu-${index}`}
                            className="w-full text-right p-3 bg-[#0f1a2a] hover:bg-gray-800 rounded-lg text-white transition-colors mb-2 border border-[#00ff88]/30"
                            onClick={() => {
                              setSourceFood(food);
                              setSourceAmount(menuFood.amount.toString());
                              setShowSourcePicker(false);
                            }}
                          >
                            <div className="font-semibold">{food.name}</div>
                            <div className="text-sm text-gray-400">{menuFood.amount} גרם</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Show all available foods */}
                  <div>
                    {menuFoods.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2 px-2">כל המזונות הזמינים:</p>
                    )}
                    {foodDatabase
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
                          className="w-full text-right p-3 bg-[#0f1a2a] hover:bg-gray-800 rounded-lg text-white transition-colors"
                          onClick={() => {
                            setSourceFood(food);
                            setSourceAmount("100");
                            setShowSourcePicker(false);
                          }}
                        >
                          <div className="font-semibold">{food.name}</div>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showTargetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTargetPicker(false)}>
          <Card className="bg-[#1a2332] border-gray-800 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-white">
                בחר מזון יעד
                {sourceFood && (
                  <span className="text-sm text-gray-400 block mt-1">
                    (רק מזונות מ-{sourceFood.category === 'carbs' ? 'פחמימות' : sourceFood.category === 'protein' ? 'חלבון' : sourceFood.category === 'fat' ? 'שומן' : sourceFood.category === 'bread' ? 'לחם' : sourceFood.category})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#00ff88]" />
                </div>
              ) : foodDatabase.length === 0 ? (
                <div className="text-center text-gray-400 py-4 space-y-2">
                  <p className="font-semibold">אין מזונות זמינים</p>
                  <p className="text-sm">אנא הוסף מזונות לטבלת nutrition_swaps במסד הנתונים</p>
                  <p className="text-xs text-gray-500 mt-2">
                    או בדוק שהטבלה קיימת ושה-RLS מוגדר נכון
                  </p>
                </div>
              ) : !sourceFood ? (
                <div className="text-center text-gray-400 py-4">
                  <p>אנא בחר מזון מקור קודם</p>
                </div>
              ) : (
                (() => {
                  // Filter foods by same category as source food
                  const sameCategoryFoods = foodDatabase.filter(f => 
                    f.id !== sourceFood.id && 
                    f.category === sourceFood.category
                  );
                  
                  if (sameCategoryFoods.length === 0) {
                    return (
                      <div className="text-center text-gray-400 py-4">
                        <p>אין מזונות נוספים בקטגוריה "{sourceFood.category}"</p>
                        <p className="text-xs mt-2">אנא הוסף מזונות נוספים לקטגוריה זו</p>
                      </div>
                    );
                  }
                  
                  return sameCategoryFoods.map((food) => (
                    <button
                      key={food.id}
                      className="w-full text-right p-3 bg-[#0f1a2a] hover:bg-gray-800 rounded-lg text-white transition-colors"
                      onClick={() => {
                        setTargetFood(food);
                        setShowTargetPicker(false);
                      }}
                    >
                      <div className="font-semibold">{food.name}</div>
                    </button>
                  ));
                })()
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a2332] border-t border-gray-800 px-4 py-2 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link href="/trainee/dashboard" className="flex flex-col items-center gap-1 py-2 px-4">
            <Home className={`h-5 w-5 ${pathname === '/trainee/dashboard' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/dashboard' ? 'text-[#00ff88]' : 'text-gray-500'}`}>בית</span>
          </Link>
          <Link href="/trainee/history" className="flex flex-col items-center gap-1 py-2 px-4">
            <BarChart3 className={`h-5 w-5 ${pathname === '/trainee/history' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/history' ? 'text-[#00ff88]' : 'text-gray-500'}`}>התקדמות</span>
          </Link>
          <Link href="/trainee/nutrition" className="flex flex-col items-center gap-1 py-2 px-4">
            <Apple className={`h-5 w-5 ${pathname === '/trainee/nutrition' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/nutrition' ? 'text-[#00ff88]' : 'text-gray-500'}`}>תזונה</span>
          </Link>
          <Link href="/trainee/workout" className="flex flex-col items-center gap-1 py-2 px-4">
            <Dumbbell className={`h-5 w-5 ${pathname?.startsWith('/trainee/workout') ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname?.startsWith('/trainee/workout') ? 'text-[#00ff88]' : 'text-gray-500'}`}>אימון</span>
          </Link>
          <Link href="/trainee/settings" className="flex flex-col items-center gap-1 py-2 px-4">
            <Settings className={`h-5 w-5 ${pathname === '/trainee/settings' ? 'text-[#00ff88]' : 'text-gray-500'}`} />
            <span className={`text-xs ${pathname === '/trainee/settings' ? 'text-[#00ff88]' : 'text-gray-500'}`}>הגדרות</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NutritionCalculator() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <NutritionCalculatorContent />
    </ProtectedRoute>
  );
}
