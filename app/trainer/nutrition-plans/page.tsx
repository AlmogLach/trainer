"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Edit, Trash2, Loader2, PieChart
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getTrainerTrainees, getActiveWorkoutPlan, getNutritionMenu } from "@/lib/db";
import type { User, NutritionMenu } from "@/lib/types";

interface NutritionPlanCard {
  id: string;
  traineeId: string;
  traineeName: string;
  planName: string;
  calorieTarget: number;
  protein: number;
  carbs: number;
  fat: number;
}

function NutritionPlansContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlanCard[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<NutritionPlanCard[]>([]);

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadNutritionPlans();
    }
  }, [trainerId]);

  useEffect(() => {
    filterPlans();
  }, [searchQuery, nutritionPlans]);

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
            // Calculate macros from nutrition menu
            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;
            
            nutritionMenu.meals.forEach(meal => {
              meal.foods.forEach(food => {
                // Mock calculation - you'll need to implement real food database
                const amount = parseFloat(food.amount) || 0;
                // These are placeholder values - replace with real food database
                totalProtein += amount * 0.2; // 20g protein per 100g
                totalCarbs += amount * 0.5; // 50g carbs per 100g
                totalFat += amount * 0.1; // 10g fat per 100g
              });
            });
            
            // Calculate calories (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
            totalCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
            
            // Calculate percentages
            const proteinPercent = totalCalories > 0 ? Math.round((totalProtein * 4 / totalCalories) * 100) : 30;
            const carbsPercent = totalCalories > 0 ? Math.round((totalCarbs * 4 / totalCalories) * 100) : 40;
            const fatPercent = totalCalories > 0 ? Math.round((totalFat * 9 / totalCalories) * 100) : 30;
            
            plans.push({
              id: workoutPlan.id,
              traineeId: trainee.id,
              traineeName: trainee.name,
              planName: `${workoutPlan.name} - ${trainee.name}`,
              calorieTarget: Math.round(totalCalories) || 2500,
              protein: proteinPercent,
              carbs: carbsPercent,
              fat: fatPercent,
            });
          }
        }
      }
      
      setNutritionPlans(plans);
    } catch (error: any) {
      console.error("Error loading nutrition plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlans = () => {
    if (!searchQuery.trim()) {
      setFilteredPlans(nutritionPlans);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = nutritionPlans.filter(plan =>
      plan.traineeName.toLowerCase().includes(query) ||
      plan.planName.toLowerCase().includes(query)
    );
    setFilteredPlans(filtered);
  };

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
            fill="#00ff88"
          />
        )}
        {carbsAngle > 0 && (
          <path
            d={createArc(carbsStart, carbsEnd)}
            fill="#ffa500"
          />
        )}
        {fatAngle > 0 && (
          <path
            d={createArc(fatStart, fatEnd)}
            fill="#ff6b6b"
          />
        )}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
          </div>
          <div>
            <p className="text-xl font-black text-foreground animate-pulse">טוען תוכניות תזונה...</p>
            <p className="text-sm text-muted-foreground mt-1">מכין את המידע התזונתי</p>
          </div>
          <div className="flex gap-2 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-5 lg:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-card via-card to-accent/10 rounded-[2rem] p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-primary font-bold text-sm uppercase tracking-wider mb-1">FitLog Nutrition 🍎</p>
              <h1 className="text-4xl font-black text-foreground">ניהול תוכניות תזונה</h1>
              <p className="text-muted-foreground text-sm mt-2">מאגר תזונה מקצועי למתאמנים</p>
            </div>
            <Link href="/trainer/nutrition-plans/new">
              <Button className="h-12 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                <Plus className="h-5 w-5 ml-2" />
                צור תוכנית תזונה חדשה
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש תוכנית תזונה..."
            className="bg-card border-2 border-border text-foreground pr-12 h-12 rounded-xl font-medium focus:border-primary transition-all"
          />
        </div>

        {/* Enhanced Nutrition Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="space-y-4">
                <div className="bg-accent/30 p-8 rounded-3xl inline-block">
                  <PieChart className="h-16 w-16 text-muted-foreground mx-auto" />
                </div>
                <p className="text-foreground font-black text-xl">
                  {searchQuery ? "לא נמצאו תוכניות תזונה" : "אין תוכניות תזונה עדיין"}
                </p>
                <p className="text-muted-foreground">התחל ליצור תוכניות תזונה למתאמנים שלך</p>
              </div>
            </div>
          ) : (
            filteredPlans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className="bg-card border-2 border-border hover:border-primary/50 transition-all shadow-lg hover:shadow-xl rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <CardTitle className="text-foreground text-xl font-black">{plan.planName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enhanced Calorie Target */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border-2 border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2 font-bold uppercase tracking-wider">יעד קלורי:</p>
                    <p className="text-3xl font-black text-primary">{plan.calorieTarget} קק"ל</p>
                  </div>

                  {/* Enhanced Pie Chart and Macros */}
                  <div className="flex items-center gap-4 bg-accent/20 rounded-xl p-4">
                    <PieChartComponent 
                      protein={plan.protein} 
                      carbs={plan.carbs} 
                      fat={plan.fat} 
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-green-500 to-green-400 shadow-sm"></div>
                        <span className="text-sm text-foreground font-bold">חלבון: {plan.protein}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-orange-500 to-orange-400 shadow-sm"></div>
                        <span className="text-sm text-foreground font-bold">פחמימות: {plan.carbs}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-red-500 to-red-400 shadow-sm"></div>
                        <span className="text-sm text-foreground font-bold">שומן: {plan.fat}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/trainer/nutrition-plans/${plan.traineeId}/edit`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full h-11 border-2 border-border text-foreground hover:bg-accent font-black rounded-xl transition-all active:scale-95"
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        ערוך
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="h-11 border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 font-black rounded-xl transition-all active:scale-95"
                      onClick={() => {
                        if (confirm("האם אתה בטוח שברצונך למחוק תוכנית תזונה זו?")) {
                          // TODO: Delete nutrition plan
                          alert("מחיקת תוכנית תזונה - יושם בהמשך");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
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

