"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Trophy, Medal, AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveWorkoutPlan, getBodyWeightHistory, getNutritionMenu, saveBodyWeight, getRoutinesWithExercises, getDailyNutritionLog } from "@/lib/db";
import { getNutritionTargets } from "@/lib/nutrition-config";
import { WeightInputModal } from "@/components/trainee/WeightInputModal";
import { BodyDataCard } from "@/components/trainee/BodyDataCard";
import { DailyWorkoutCard } from "@/components/trainee/DailyWorkoutCard";
import { NutritionSummary } from "@/components/trainee/NutritionSummary";
import type { WorkoutPlan, NutritionMenu, RoutineWithExercises, DailyNutritionLog } from "@/lib/types";

export default function TraineeDashboard() {
  const { user } = useAuth();
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [currentRoutine, setCurrentRoutine] = useState<RoutineWithExercises | null>(null);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  const [nutritionLog, setNutritionLog] = useState<DailyNutritionLog | null>(null);

  // Load data from Supabase
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null); // איפוס שגיאה לפני טעינה

      // Load independent data in parallel
      const [plan, weights, menu, log] = await Promise.all([
        getActiveWorkoutPlan(user.id),
        getBodyWeightHistory(user.id),
        getNutritionMenu(user.id),
        getDailyNutritionLog(user.id),
      ]);

      setWorkoutPlan(plan);
      setWeightHistory(weights);
      setNutritionMenu(menu);
      setNutritionLog(log);

      // Load routines only if plan exists (dependent on plan)
      if (plan) {
        const routines = await getRoutinesWithExercises(plan.id);
        if (routines.length > 0) {
          // Get today's routine (simplified - just take first routine for now)
          setCurrentRoutine(routines[0]);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('אירעה שגיאה בטעינת הנתונים. אנא נסה שנית מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSave = async (weight: number) => {
    if (!user?.id) return;
    try {
      await saveBodyWeight(user.id, weight);
      await loadDashboardData();
    } catch (error) {
      console.error('Error saving weight:', error);
      setError('שגיאה בשמירת המשקל. אנא נסה שוב.');
    }
  };

  // Get nutrition targets from configuration
  const nutritionTargets = getNutritionTargets(user?.id);

  // תצוגת טעינה משופרת
  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
          </div>
          <div>
            <p className="text-xl font-black text-foreground animate-pulse">טוען את הנתונים שלך...</p>
            <p className="text-sm text-muted-foreground mt-1">מכין את הסקירה היומית</p>
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

  // תצוגת שגיאה משופרת
  if (error) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="bg-red-500/10 p-6 rounded-3xl border-2 border-red-500/30">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-foreground">משהו השתבש</h3>
          <p className="text-muted-foreground max-w-md text-base">{error}</p>
        </div>
        <Button 
          onClick={loadDashboardData} 
          className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          נסה שוב
        </Button>
      </div>
    );
  }

  // התוכן הראשי משופר
  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* Welcome Header - Connected to top header */}
      <div className="bg-gradient-to-r from-card to-card/95 border-b-2 border-border rounded-b-2xl sm:rounded-b-[2rem] px-4 sm:px-6 py-4 sm:py-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider">ברוך הבא 👋</p>
            <div className="bg-orange-500/20 p-1.5 rounded-lg">
              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2">
            הסקירה היומית שלך
            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-2">כל מה שאתה צריך לדעת היום</p>
        </div>
      </div>

      {/* Content with padding */}
      <div className="px-3 sm:px-4 lg:px-5 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Today's Workout Section */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <DailyWorkoutCard 
            workoutPlan={workoutPlan}
            currentRoutine={currentRoutine}
          />
        </div>

        {/* Nutrition Log Section */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
          <NutritionSummary 
            nutritionLog={nutritionLog}
            targets={nutritionTargets}
          />
        </div>

        {/* Body Data Section */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms' }}>
          <BodyDataCard
            weightHistory={weightHistory}
            onAddWeight={() => setShowWeightInput(true)}
          />
        </div>

        {/* Enhanced Achievements Section */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '300ms' }}>
          <Card className="bg-gradient-to-br from-card via-card to-accent/10 border-2 border-border shadow-lg overflow-hidden rounded-2xl sm:rounded-[2rem] relative">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -z-10" />
            
            <CardHeader className="relative z-10 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                </div>
                <CardTitle className="text-foreground text-lg sm:text-xl font-black">הישגים חדשים</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl relative">
                    <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl animate-pulse" />
                    <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white relative z-10" />
                  </div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl relative">
                    <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl animate-pulse" style={{ animationDelay: '500ms' }} />
                    <Medal className="h-8 w-8 sm:h-10 sm:w-10 text-white relative z-10" />
                  </div>
                </div>
                <div className="flex-1 space-y-2 sm:space-y-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 sm:gap-3 bg-accent/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-border/50">
                    <div className="bg-primary/20 p-1 sm:p-1.5 rounded-lg">
                      <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <span className="text-foreground font-bold text-sm sm:text-base">שיא חדש בבנץ' פרס</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-accent/30 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-border/50">
                    <div className="bg-primary/20 p-1 sm:p-1.5 rounded-lg">
                      <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <span className="text-foreground font-bold text-sm sm:text-base">התקדמות בסקוואט</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weight Input Modal */}
      <WeightInputModal
        isOpen={showWeightInput}
        onClose={() => setShowWeightInput(false)}
        onSave={handleWeightSave}
      />
    </div>
  );
}


