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
    <div className="min-h-screen" dir="rtl">
      {/* Enhanced Header with FitLog Style */}
      <div className="bg-gradient-to-br from-card via-card to-accent/10 px-6 pt-6 pb-6 rounded-b-[2.5rem] shadow-lg mb-6 relative overflow-hidden sticky top-0 z-10">
        {/* Animated Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/30 rounded-full blur-2xl -z-10 -translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-2xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-2xl shadow-lg">
              <Apple className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">מחשבון המרות</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Nutrition Calculator</p>
            </div>
          </div>
          
          <Link href="/trainee/dashboard">
            <div className="bg-background p-2.5 rounded-2xl shadow-md border border-border hover:bg-accent/50 transition-all active:scale-95">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 space-y-6">
        {/* Nutrition Menu Card */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <NutritionMenuCard menu={nutritionMenu} variant="dark" />
        </div>

        {/* Food Comparison Cards */}
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
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
          <Card className="bg-card border-border shadow-md rounded-[2rem] animate-in zoom-in duration-500" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6 space-y-5">
              {/* Protein */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground text-sm font-bold">חלבון</span>
                  <span className="text-muted-foreground text-sm font-medium">{proteinCurrent.toFixed(0)} / {proteinTarget.toFixed(0)} גרם</span>
                </div>
                <div className="relative h-3 bg-accent/30 rounded-full overflow-hidden">
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
                  <span className="text-foreground text-sm font-bold">פחמימות</span>
                  <span className="text-muted-foreground text-sm font-medium">{carbsCurrent.toFixed(0)} / {carbsTarget.toFixed(0)} גרם</span>
                </div>
                <div className="relative h-3 bg-accent/30 rounded-full overflow-hidden">
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
                  <span className="text-foreground text-sm font-bold">שומן</span>
                  <span className="text-muted-foreground text-sm font-medium">{fatCurrent.toFixed(1)} / {fatTarget.toFixed(1)} גרם</span>
                </div>
                <div className="relative h-3 bg-accent/30 rounded-full overflow-hidden">
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
          <Card className="bg-card border-primary/30 border-2 shadow-lg shadow-primary/10 rounded-[2rem] animate-in zoom-in duration-500" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-xl font-black">תוצאות ההמרה 🎯</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main conversion info */}
              <div className="bg-accent/30 rounded-2xl p-5 space-y-3 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">מקור:</span>
                  <span className="text-foreground font-bold">
                    {sourceAmount} גרם {sourceFood.name}
                  </span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <div className="bg-primary/20 p-2 rounded-xl">
                    <span className="text-primary text-2xl">⇄</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">יעד (משוער):</span>
                  <span className="text-primary font-black text-xl">
                    ~{targetAmount} גרם {targetFood.name}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs text-center mt-3 bg-background/50 rounded-lg p-2">
                  💡 הכמות משוערת - ערכים דומים, לא זהים בדיוק
                </p>
              </div>

              {/* Macros comparison */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                  <div className="text-muted-foreground text-xs mb-1 font-bold uppercase">חלבון</div>
                  <div className="text-foreground font-black text-lg">
                    {targetMacros.protein.toFixed(1)}
                    <span className="text-xs text-muted-foreground mr-1">גרם</span>
                    {Math.abs(macroDiffs.protein) > 2 && (
                      <span className={`text-xs block mt-1 ${macroDiffs.protein > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                        ({macroDiffs.protein > 0 ? '+' : ''}{macroDiffs.protein.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                  <div className="text-muted-foreground text-xs mb-1 font-bold uppercase">פחמימות</div>
                  <div className="text-foreground font-black text-lg">
                    {targetMacros.carbs.toFixed(1)}
                    <span className="text-xs text-muted-foreground mr-1">גרם</span>
                    {Math.abs(macroDiffs.carbs) > 5 && (
                      <span className={`text-xs block mt-1 ${macroDiffs.carbs > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                        ({macroDiffs.carbs > 0 ? '+' : ''}{macroDiffs.carbs.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                  <div className="text-muted-foreground text-xs mb-1 font-bold uppercase">שומן</div>
                  <div className="text-foreground font-black text-lg">
                    {targetMacros.fat.toFixed(1)}
                    <span className="text-xs text-muted-foreground mr-1">גרם</span>
                    {Math.abs(macroDiffs.fat) > 2 && (
                      <span className={`text-xs block mt-1 ${macroDiffs.fat > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                        ({macroDiffs.fat > 0 ? '+' : ''}{macroDiffs.fat.toFixed(1)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                  <div className="text-muted-foreground text-xs mb-1 font-bold uppercase">קלוריות</div>
                  <div className="text-foreground font-black text-lg">
                    {targetMacros.calories.toFixed(0)}
                    <span className="text-xs text-muted-foreground mr-1">קק"ל</span>
                    {Math.abs(macroDiffs.calories) > 20 && (
                      <span className={`text-xs block mt-1 ${macroDiffs.calories > 0 ? 'text-orange-400' : 'text-blue-400'}`}>
                        ({macroDiffs.calories > 0 ? '+' : ''}{macroDiffs.calories.toFixed(0)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match quality */}
              <div className={`flex items-center justify-between pt-3 mt-3 border-t-2 ${
                matchQuality.color === 'green' ? 'border-primary/30' :
                matchQuality.color === 'yellow' ? 'border-yellow-400/30' :
                'border-red-400/30'
              }`}>
                <span className="text-muted-foreground font-medium">דיוק ההמרה:</span>
                <span className={`font-black text-lg ${
                  matchQuality.color === 'green' ? 'text-primary' :
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
        <Card className="bg-card border-border shadow-md rounded-[2rem] animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground text-lg font-black flex items-center gap-2">
              <div className="bg-primary/20 p-2 rounded-xl">
                <Apple className="w-5 h-5 text-primary" />
              </div>
              חיפוש מזונות
            </CardTitle>
            <p className="text-muted-foreground text-xs mt-1">FoodsDictionary - מאגר ערכים תזונתיים</p>
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
                    className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all font-medium"
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
                    className="bg-primary hover:bg-primary/90 text-background font-black px-8 py-3 h-auto rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    חיפוש
                  </Button>
                </div>
              </form>
            </div>
            <p className="text-muted-foreground text-xs text-center mt-3 bg-accent/30 rounded-xl p-2">
              💡 השתמש בחיפוש זה כדי למצוא ערכים תזונתיים מדויקים למזונות שונים
            </p>
          </CardContent>
        </Card>

        {/* Info Card - This is just a calculator, not a logger */}
        {sourceFood && targetFood && sourceAmount && targetAmount && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 border-2 shadow-md rounded-[2rem] animate-in fade-in zoom-in duration-500" style={{ animationDelay: '500ms' }}>
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-primary/20 p-2 rounded-xl">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-foreground text-base font-black">
                    מחשבון המרות
                  </p>
                </div>
                <p className="text-muted-foreground text-sm font-medium">
                  עוזר לך לגוון את התזונה בצורה מדויקת
                </p>
                <p className="text-muted-foreground text-xs bg-background/50 rounded-xl p-3">
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
      </div>

      {/* Food Picker Modals */}
      {showSourcePicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setShowSourcePicker(false)}>
          <Card className="bg-card border-border shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden rounded-[2rem] animate-in zoom-in-95 slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="text-foreground font-black text-xl flex items-center gap-2">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <Apple className="w-5 h-5 text-primary" />
                </div>
                בחר מזון מקור
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
              ) : (
                <>
                  {/* Show menu foods first if available */}
                  {menuFoods.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3 px-2">
                        <div className="bg-primary/20 p-1 rounded-lg">
                          <Apple className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">מהתפריט שלך</p>
                      </div>
                      {menuFoods.map((menuFood, index) => {
                        const food = foodDatabase.find(f => f.name === menuFood.name);
                        if (!food) return null;
                        return (
                          <button
                            key={`menu-${index}`}
                            className="w-full text-right p-4 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 rounded-2xl text-foreground transition-all mb-2 border-2 border-primary/30 active:scale-98 shadow-sm"
                            onClick={() => {
                              setSourceFood(food);
                              setSourceAmount(menuFood.amount.toString());
                              setShowSourcePicker(false);
                            }}
                          >
                            <div className="font-black text-base">{food.name}</div>
                            <div className="text-sm text-muted-foreground font-medium mt-1">{menuFood.amount} גרם</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Show all available foods */}
                  <div>
                    {menuFoods.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 px-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">כל המזונות הזמינים</p>
                      </div>
                    )}
                    <div className="space-y-2">
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
                            className="w-full text-right p-4 bg-accent/30 hover:bg-accent/50 rounded-2xl text-foreground transition-all border border-border/50 hover:border-primary/30 active:scale-98"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setShowTargetPicker(false)}>
          <Card className="bg-card border-border shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden rounded-[2rem] animate-in zoom-in-95 slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="text-foreground font-black text-xl flex items-center gap-2">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <Beef className="w-5 h-5 text-primary" />
                </div>
                <div>
                  בחר מזון יעד
                  {sourceFood && (
                    <span className="text-xs text-muted-foreground block mt-1 font-medium">
                      רק מזונות מ-{sourceFood.category === 'carbs' ? 'פחמימות' : sourceFood.category === 'protein' ? 'חלבון' : sourceFood.category === 'fat' ? 'שומן' : sourceFood.category === 'bread' ? 'לחם' : sourceFood.category}
                    </span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground text-sm font-medium">טוען מזונות...</p>
                </div>
              ) : foodDatabase.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 space-y-3 bg-accent/30 rounded-2xl p-6">
                  <div className="text-4xl">📭</div>
                  <p className="font-bold text-foreground">אין מזונות זמינים</p>
                  <p className="text-sm">אנא הוסף מזונות לטבלת nutrition_swaps במסד הנתונים</p>
                  <p className="text-xs bg-background/50 rounded-xl p-2 mt-2">
                    או בדוק שהטבלה קיימת ושה-RLS מוגדר נכון
                  </p>
                </div>
              ) : !sourceFood ? (
                <div className="text-center text-muted-foreground py-8 bg-accent/30 rounded-2xl p-6">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="font-bold text-foreground">אנא בחר מזון מקור קודם</p>
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
                      <div className="text-center text-muted-foreground py-8 space-y-3 bg-accent/30 rounded-2xl p-6">
                        <div className="text-4xl">🔍</div>
                        <p className="font-bold text-foreground">אין מזונות נוספים בקטגוריה "{sourceFood.category}"</p>
                        <p className="text-xs bg-background/50 rounded-xl p-2 mt-2">אנא הוסף מזונות נוספים לקטגוריה זו</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-2">
                      {sameCategoryFoods.map((food) => (
                        <button
                          key={food.id}
                          className="w-full text-right p-4 bg-accent/30 hover:bg-accent/50 rounded-2xl text-foreground transition-all border border-border/50 hover:border-primary/30 active:scale-98"
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

    </div>
  );
}

export default function NutritionCalculator() {
  return <NutritionCalculatorContent />;
}
