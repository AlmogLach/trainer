"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Loader2, Trophy, Medal, AlertCircle, Dumbbell, TrendingUp, Calendar, FileText, 
  BarChart3, ArrowUpRight, ChevronLeft, Activity, Target, Scale, LineChart, Zap, Apple, Clock, CheckCircle2, Timer, X,
  Footprints, Flame, Droplet, Play, TrendingDown
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveWorkoutPlan, getBodyWeightHistory, getNutritionMenu, saveBodyWeight, getRoutinesWithExercises, getDailyNutritionLog, getWorkoutLogs } from "@/lib/db";
import { getNutritionTargets } from "@/lib/nutrition-config";
import { WeightInputModal } from "@/components/trainee/WeightInputModal";
import { calculateTraineeStats } from "@/lib/trainee-stats";
import { SimpleLineChart } from "@/components/ui/SimpleLineChart";
import type { WorkoutPlan, NutritionMenu, RoutineWithExercises, DailyNutritionLog, WorkoutLogWithDetails } from "@/lib/types";

// --- Stat Card Component with Milky Gradients ---
function StatCard({ title, value, icon: Icon, subValue, colorTheme }: any) {
  const themes = {
    blue: { 
        bg: "bg-gradient-to-br from-blue-500/80 to-blue-600/50 dark:from-blue-600/40 dark:to-blue-800/20", 
        text: "text-white dark:text-blue-100", 
        iconBg: "bg-white/20 dark:bg-blue-500/20",
        subText: "text-blue-100 dark:text-blue-300/70"
    },
    indigo: { 
        bg: "bg-gradient-to-br from-indigo-500/80 to-indigo-600/50 dark:from-indigo-600/40 dark:to-indigo-800/20", 
        text: "text-white dark:text-indigo-100", 
        iconBg: "bg-white/20 dark:bg-indigo-500/20",
        subText: "text-indigo-100 dark:text-indigo-300/70"
    },
    emerald: { 
        bg: "bg-gradient-to-br from-emerald-500/80 to-emerald-600/50 dark:from-emerald-600/40 dark:to-emerald-800/20", 
        text: "text-white dark:text-emerald-100", 
        iconBg: "bg-white/20 dark:bg-emerald-500/20",
        subText: "text-emerald-100 dark:text-emerald-300/70"
    },
    red: { 
        bg: "bg-gradient-to-br from-red-500/80 to-red-600/50 dark:from-red-600/40 dark:to-red-800/20", 
        text: "text-white dark:text-red-100", 
        iconBg: "bg-white/20 dark:bg-red-500/20",
        subText: "text-red-100 dark:text-red-300/70"
    },
  };
  
  const theme = themes[colorTheme as keyof typeof themes];

  return (
    <Card className={`relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all ${theme.bg} backdrop-blur-md`}>
      <CardContent className="p-5 flex flex-col h-28 justify-between">
        <div className="flex justify-between items-start mb-3">
          <h3 className={`text-sm font-medium ${theme.text} tracking-wide opacity-90`}>{title}</h3>
          <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.text} shadow-sm backdrop-blur-sm`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div>
          <div className={`text-3xl font-black ${theme.text} tracking-tight flex items-baseline gap-1.5`}>
            {value}
            {subValue && <span className={`text-sm font-semibold ${theme.subText}`}>{subValue}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TraineeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [todayRoutine, setTodayRoutine] = useState<RoutineWithExercises | null>(null);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);
  const [nutritionMenu, setNutritionMenu] = useState<NutritionMenu | null>(null);
  const [nutritionLog, setNutritionLog] = useState<DailyNutritionLog | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogWithDetails[]>([]);
  const [stats, setStats] = useState({
    weeklyCompliance: { completed: 0, target: 5, percent: 0 },
    weeklyWorkouts: 0,
    weeklyPRs: 0,
    currentWeight: null as number | null,
    weightChange: null as number | null,
  });
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WorkoutLogWithDetails[]>([]);
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<WorkoutLogWithDetails | null>(null);

  const traineeId = user?.id || "";

  useEffect(() => {
    // Reset loading state when auth status changes
    if (authLoading) {
      setLoading(true);
      return;
    }

    // If no user after auth loads, stop loading
    if (!traineeId) {
      setLoading(false);
      return;
    }

    // Load data when we have a trainee ID
    let cancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 10000)
        );
        
        const dataPromise = Promise.all([
          getActiveWorkoutPlan(traineeId),
          getBodyWeightHistory(traineeId),
          getNutritionMenu(traineeId),
          getDailyNutritionLog(traineeId),
          getWorkoutLogs(traineeId, 30), // Last 30 workouts
        ]);
        
        const result = await Promise.race([
          dataPromise,
          timeoutPromise,
        ]);
        
        const [plan, weights, menu, log, logs] = result;
        
        if (!cancelled) {
          setWorkoutPlan(plan);
          setWeightHistory(weights);
          setNutritionMenu(menu);
          setNutritionLog(log);
          setWorkoutLogs(logs);

          // Load routines only if plan exists
          let routinesData: RoutineWithExercises[] = [];
          if (plan) {
            routinesData = await getRoutinesWithExercises(plan.id);
            // Check cancelled again after async operation
            if (!cancelled) {
              // Sort routines by letter (A, B, C, D, E)
              const letterOrder: any = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
              routinesData.sort((a, b) => (letterOrder[a.letter] || 99) - (letterOrder[b.letter] || 99));
              setRoutines(routinesData);
              
              // Calculate today's routine
              const today = new Date().toISOString().split('T')[0];
              const todayLog = logs.find(l => l.date === today);
              let routineToShow: RoutineWithExercises | null = null;
              
              if (todayLog && routinesData.length > 0) {
                const lastRoutineIndex = routinesData.findIndex(r => r.id === todayLog.routine_id);
                const nextIndex = lastRoutineIndex >= 0 && lastRoutineIndex < routinesData.length - 1
                  ? lastRoutineIndex + 1
                  : 0;
                routineToShow = routinesData[nextIndex];
              } else if (routinesData.length > 0) {
                routineToShow = routinesData[0];
              }
              
              setTodayRoutine(routineToShow);
            }
          }

          // Calculate week start
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekLogs = logs.filter(l => 
            new Date(l.date) >= weekStart && l.completed
          );
          const weeklyTarget = plan?.weekly_target_workouts || 5;
          
          // Calculate weekly PRs
          const weekSetLogs = weekLogs.flatMap(log => log.set_logs || []);
          const previousSetLogs = logs
            .filter(l => new Date(l.date) < weekStart)
            .flatMap(log => log.set_logs || []);
          
          let prCount = 0;
          weekSetLogs.forEach(weekSet => {
            const exercisePRs = previousSetLogs
              .filter(prev => prev.exercise_id === weekSet.exercise_id)
              .map(prev => ({ weight: prev.weight_kg, reps: prev.reps }))
              .sort((a, b) => b.weight - a.weight || b.reps - a.reps);
            
            const bestPrevious = exercisePRs[0];
            if (bestPrevious && (
              weekSet.weight_kg > bestPrevious.weight ||
              (weekSet.weight_kg === bestPrevious.weight && weekSet.reps > bestPrevious.reps)
            )) {
              prCount++;
            }
          });

          // Calculate weight stats
          const currentWeight = weights.length > 0 ? weights[0].weight : null;
          const initialWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
          const weightChange = currentWeight && initialWeight ? currentWeight - initialWeight : null;

          setStats({
            weeklyCompliance: {
              completed: weekLogs.length,
              target: weeklyTarget,
              percent: weeklyTarget > 0 
                ? Math.min(100, Math.round((weekLogs.length / weeklyTarget) * 100))
                : 0
            },
            weeklyWorkouts: weekLogs.length,
            weeklyPRs: prCount,
            currentWeight,
            weightChange,
          });

          // Get weekly workouts (only completed ones to match stats)
          setWeeklyWorkouts(logs.filter(l => new Date(l.date) >= weekStart && l.completed));
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        if (!cancelled) {
          setError('אירעה שגיאה בטעינת הנתונים. אנא נסה שנית מאוחר יותר.');
          setStats({
            weeklyCompliance: { completed: 0, target: 5, percent: 0 },
            weeklyWorkouts: 0,
            weeklyPRs: 0,
            currentWeight: null,
            weightChange: null,
          });
          setWeeklyWorkouts([]);
          setRoutines([]);
          setTodayRoutine(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [traineeId, authLoading]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "לא בוצע";
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", { day: 'numeric', month: 'short' });
  };

  const handleWeightSave = useCallback(async (weight: number) => {
    if (!user?.id) return;
    try {
      await saveBodyWeight(user.id, weight);
      // Reload data
      const [weights, logs] = await Promise.all([
        getBodyWeightHistory(user.id),
        getWorkoutLogs(user.id, 30),
      ]);
      setWeightHistory(weights);
      setWorkoutLogs(logs);
      
      // Recalculate all stats including weekly stats
      const currentWeight = weights.length > 0 ? weights[0].weight : null;
      const initialWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
      const weightChange = currentWeight && initialWeight ? currentWeight - initialWeight : null;
      
      // Calculate week start
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekLogs = logs.filter(l => 
        new Date(l.date) >= weekStart && l.completed
      );
      const weeklyTarget = workoutPlan?.weekly_target_workouts || 5;
      
      // Calculate weekly PRs
      const weekSetLogs = weekLogs.flatMap(log => log.set_logs || []);
      const previousSetLogs = logs
        .filter(l => new Date(l.date) < weekStart)
        .flatMap(log => log.set_logs || []);
      
      let prCount = 0;
      weekSetLogs.forEach(weekSet => {
        const exercisePRs = previousSetLogs
          .filter(prev => prev.exercise_id === weekSet.exercise_id)
          .map(prev => ({ weight: prev.weight_kg, reps: prev.reps }))
          .sort((a, b) => b.weight - a.weight || b.reps - a.reps);
        
        const bestPrevious = exercisePRs[0];
        if (bestPrevious && (
          weekSet.weight_kg > bestPrevious.weight ||
          (weekSet.weight_kg === bestPrevious.weight && weekSet.reps > bestPrevious.reps)
        )) {
          prCount++;
        }
      });
      
      setStats({
        weeklyCompliance: {
          completed: weekLogs.length,
          target: weeklyTarget,
          percent: weeklyTarget > 0 
            ? Math.min(100, Math.round((weekLogs.length / weeklyTarget) * 100))
            : 0
        },
        weeklyWorkouts: weekLogs.length,
        weeklyPRs: prCount,
        currentWeight,
        weightChange,
      });
      
      // Update weekly workouts list (only completed ones)
      setWeeklyWorkouts(logs.filter(l => new Date(l.date) >= weekStart && l.completed));
    } catch (error) {
      console.error('Error saving weight:', error);
      setError('שגיאה בשמירת המשקל. אנא נסה שוב.');
    }
  }, [user?.id, workoutPlan]);

  // Get nutrition targets from configuration
  const nutritionTargets = useMemo(() => getNutritionTargets(user?.id), [user?.id]);

  // Calculate nutrition progress
  const nutritionProgress = useMemo(() => {
    if (!nutritionLog) return null;
    return {
      protein: nutritionLog.total_protein || 0,
      carbs: nutritionLog.total_carbs || 0,
      fat: nutritionLog.total_fat || 0,
      calories: nutritionLog.total_calories || 0,
      proteinPercent: nutritionTargets.protein > 0 ? Math.min(100, (nutritionLog.total_protein || 0) / nutritionTargets.protein * 100) : 0,
      carbsPercent: nutritionTargets.carbs > 0 ? Math.min(100, (nutritionLog.total_carbs || 0) / nutritionTargets.carbs * 100) : 0,
      fatPercent: nutritionTargets.fat > 0 ? Math.min(100, (nutritionLog.total_fat || 0) / nutritionTargets.fat * 100) : 0,
      caloriesPercent: nutritionTargets.calories > 0 ? Math.min(100, (nutritionLog.total_calories || 0) / nutritionTargets.calories * 100) : 0,
    };
  }, [nutritionLog, nutritionTargets]);

  // Prepare weight chart data (last 14 days)
  const weightChartData = useMemo(() => {
    return weightHistory.slice(0, 14).reverse().map(w => ({
      date: w.date,
      weight: w.weight,
    }));
  }, [weightHistory]);

  // Calculate mock activity stats (can be replaced with real data later)
  const activityStats = useMemo(() => {
    // Mock steps - could be calculated from workout duration/intensity
    const steps = 2390;
    const stepsKm = (steps * 0.7 / 1000).toFixed(2); // Approximate km
    
    // Use real calories from nutrition log if available
    const calories = nutritionProgress?.calories || 2390;
    
    // Mock water intake (ml) - could be tracked separately
    const water = 1000;
    
    return { steps, stepsKm, calories, water };
  }, [nutritionProgress]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "בוקר טוב";
    if (hour < 18) return "צהריים טובים";
    return "ערב טוב";
  };

  if (authLoading || loading) {
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
          <p className="text-sm text-gray-500 dark:text-slate-400">מכין את הדשבורד שלך</p>
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
    <div className="space-y-6 pb-32">
      
      {/* --- Greeting Section --- */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
            {getGreeting()}, המשך לזוז היום!
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            שלום, {user?.name || 'מתאמן'}
          </h1>
        </div>
        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-gray-200 dark:border-gray-700">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-black text-lg">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* --- Stay Active Banner --- */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-teal-500 via-emerald-500 to-lime-500 dark:from-teal-600 dark:via-emerald-600 dark:to-lime-600 overflow-hidden rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-white mb-1">הישאר פעיל</h2>
              <p className="text-sm sm:text-base text-white/90 font-medium">
                הבוסט היומי שלך לאנרגיה!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Your Recent Stats Section --- */}
      <div>
        <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4">
          הסטטיסטיקות האחרונות שלך
        </h2>
        
        <div className="space-y-4">
          {/* Steps Card */}
          <Card className="border-none shadow-md bg-gradient-to-br from-yellow-400/90 to-amber-500/90 dark:from-yellow-500/80 dark:to-amber-600/80 overflow-hidden rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
                    <Footprints className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white/90">צעדים</h3>
                    <p className="text-2xl sm:text-3xl font-black text-white">{activityStats.steps.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{activityStats.stepsKm} ק״מ</p>
                </div>
              </div>
              {/* Simple bar chart for steps */}
              <div className="flex items-end gap-1.5 h-12">
                {[2, 3, 2.5, 3.2, 2.8, 3.5, 2.4].map((height, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-white/30 rounded-t-lg"
                    style={{ height: `${height * 20}%` }}
                  />
                ))}
                <div className="flex-1 bg-white rounded-t-lg h-full" />
              </div>
            </CardContent>
          </Card>

          {/* Calories and Water Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Calories Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-orange-500/90 to-red-500/90 dark:from-orange-600/80 dark:to-red-600/80 overflow-hidden rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                    <Flame className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white/90">קלוריות</h3>
                    <p className="text-xl font-black text-white">{Math.round(activityStats.calories).toLocaleString()} קק״ל</p>
                  </div>
                </div>
                {/* Circular progress */}
                <div className="relative w-16 h-16">
                  <svg className="transform -rotate-90 w-16 h-16">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="white"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(100, (activityStats.calories / (nutritionTargets.calories || 2500)) * 100) / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black text-white">
                      {Math.round((activityStats.calories / (nutritionTargets.calories || 2500)) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Water Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/90 to-cyan-500/90 dark:from-blue-600/80 dark:to-cyan-600/80 overflow-hidden rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                    <Droplet className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white/90">מים</h3>
                    <p className="text-xl font-black text-white">{activityStats.water.toLocaleString()} מ״ל</p>
                  </div>
                </div>
                {/* Wavy line graph */}
                <div className="h-12 flex items-end gap-0.5">
                  {[0.3, 0.5, 0.4, 0.6, 0.5, 0.7, 0.6].map((height, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-white/40 rounded-t"
                      style={{ height: `${height * 100}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* --- Trending Workouts Section --- */}
      <div>
        <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-4">
          אימונים פופולריים
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {routines.length > 0 ? (
            routines.slice(0, 5).map((routine, idx) => (
              <Link
                key={routine.id}
                href="/trainee/workout"
                className="flex-shrink-0 w-48 sm:w-56"
              >
                <Card className="border-none shadow-md bg-white dark:bg-slate-900/50 overflow-hidden rounded-2xl hover:shadow-lg transition-all">
                  <CardContent className="p-0">
                    {/* Placeholder workout image */}
                    <div className="h-32 sm:h-40 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center">
                      <Dumbbell className="h-12 w-12 text-white/80" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">💪</span>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate">
                          {routine.name || `אימון ${routine.letter}`}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                        {routine.routine_exercises?.length || 0} תרגילים
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="border-none shadow-md bg-white dark:bg-slate-900/50 overflow-hidden rounded-2xl flex-shrink-0 w-48 sm:w-56">
              <CardContent className="p-0">
                <div className="h-32 sm:h-40 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                  <Dumbbell className="h-12 w-12 text-gray-400" />
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-slate-400">אין אימונים זמינים</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* --- Today's Workout Card --- */}
      {todayRoutine ? (
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500/90 to-purple-600/80 dark:from-blue-600/80 dark:to-purple-700/70 overflow-hidden rounded-2xl animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-5 sm:p-6 min-h-[180px] sm:min-h-[200px] flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  <h2 className="text-xl sm:text-2xl font-black text-white">האימון של היום</h2>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white/90 mb-1">{todayRoutine.name}</p>
                {todayRoutine.description && (
                  <p className="text-sm text-white/80">{todayRoutine.description}</p>
                )}
              </div>
            </div>
            
            {todayRoutine.routine_exercises && todayRoutine.routine_exercises.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-white/90 mb-2">תרגילים:</p>
                <div className="flex flex-wrap gap-2">
                  {todayRoutine.routine_exercises.slice(0, 4).map((re, idx) => (
                    <div key={re.id} className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-white">
                      {re.exercise?.name || `תרגיל ${idx + 1}`}
                    </div>
                  ))}
                  {todayRoutine.routine_exercises.length > 4 && (
                    <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-white">
                      ועוד {todayRoutine.routine_exercises.length - 4} תרגילים
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Link href="/trainee/workout" className="w-full">
              <Button className="w-full h-12 sm:h-14 bg-white hover:bg-white/90 text-blue-600 dark:text-blue-700 font-black text-base sm:text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02]">
                <Dumbbell className="h-5 w-5 ml-2" />
                התחל אימון
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : workoutPlan ? (
        <Card className="border-none shadow-lg bg-gradient-to-br from-gray-500/90 to-gray-600/80 dark:from-gray-600/80 dark:to-gray-700/70 overflow-hidden rounded-2xl">
          <CardContent className="p-5 sm:p-6 min-h-[180px] sm:min-h-[200px] flex flex-col justify-center items-center text-center">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-white/80 mb-4" />
            <h2 className="text-xl sm:text-2xl font-black text-white mb-2">אין תוכנית אימונים פעילה</h2>
            <p className="text-sm sm:text-base text-white/80">צור קשר עם המאמן שלך להגדרת תוכנית</p>
          </CardContent>
        </Card>
      ) : null}

      {/* --- Stats Grid with Milky Gradients --- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '50ms' }}>
        <StatCard
          title="עקביות השבוע"
          value={`${stats.weeklyCompliance.completed} / ${stats.weeklyCompliance.target}`}
          subValue={`${stats.weeklyCompliance.percent}%`}
          icon={Target}
          colorTheme="emerald"
        />
        <StatCard
          title="אימונים השבוע"
          value={stats.weeklyWorkouts}
          subValue="הושלמו"
          icon={Calendar}
          colorTheme="blue"
        />
        <StatCard
          title="שיאים השבוע"
          value={stats.weeklyPRs}
          subValue="שיאים אישיים"
          icon={Trophy}
          colorTheme="red"
        />
        <StatCard
          title="משקל נוכחי"
          value={stats.currentWeight ? `${stats.currentWeight.toFixed(1)}` : "—"}
          subValue={stats.weightChange !== null ? (stats.weightChange > 0 ? `+${stats.weightChange.toFixed(1)} ק״ג` : stats.weightChange < 0 ? `${stats.weightChange.toFixed(1)} ק״ג` : "ללא שינוי") : ""}
          icon={Scale}
          colorTheme={stats.weightChange !== null && stats.weightChange > 0 ? "emerald" : stats.weightChange !== null && stats.weightChange < 0 ? "red" : "indigo"}
        />
      </div>

      <div className="space-y-6 sm:space-y-8">
          
          {/* --- Progress Chart --- */}
          {weightChartData.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <LineChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-500" /> התקדמות משקל (14 ימים)
                </h2>
              </div>
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <SimpleLineChart
                    data={weightChartData}
                    height={150}
                    unit="kg"
                    showGradient={true}
                    showTooltip={true}
                    showXAxis={true}
                    useThemeColors={true}
                  />
                </CardContent>
              </Card>
            </section>
          )}

          {/* --- Nutrition Today --- */}
          {nutritionProgress && (nutritionMenu || nutritionLog) && (
            <section className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Apple className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-500" /> תזונה היום
                </h2>
                <Link href="/trainee/nutrition" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  פרטים
                </Link>
              </div>
              <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/80 to-orange-500/80 dark:from-emerald-600/60 dark:to-orange-600/60 overflow-hidden rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-4">
                    {/* Protein */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-white">חלבונים</span>
                        <span className="text-sm font-bold text-white">{Math.round(nutritionProgress.protein)} / {nutritionTargets.protein} גרם</span>
                      </div>
                      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            nutritionProgress.proteinPercent >= 80 ? 'bg-emerald-200' : 
                            nutritionProgress.proteinPercent >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                          }`}
                          style={{ width: `${Math.min(100, nutritionProgress.proteinPercent)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Carbs */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-white">פחמימות</span>
                        <span className="text-sm font-bold text-white">{Math.round(nutritionProgress.carbs)} / {nutritionTargets.carbs} גרם</span>
                      </div>
                      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            nutritionProgress.carbsPercent >= 80 ? 'bg-emerald-200' : 
                            nutritionProgress.carbsPercent >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                          }`}
                          style={{ width: `${Math.min(100, nutritionProgress.carbsPercent)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Fat */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-white">שומנים</span>
                        <span className="text-sm font-bold text-white">{Math.round(nutritionProgress.fat)} / {nutritionTargets.fat} גרם</span>
                      </div>
                      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            nutritionProgress.fatPercent >= 80 ? 'bg-emerald-200' : 
                            nutritionProgress.fatPercent >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                          }`}
                          style={{ width: `${Math.min(100, nutritionProgress.fatPercent)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Calories */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-white">קלוריות</span>
                        <span className="text-sm font-bold text-white">{Math.round(nutritionProgress.calories)} / {nutritionTargets.calories} קק״ל</span>
                      </div>
                      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            nutritionProgress.caloriesPercent >= 80 ? 'bg-emerald-200' : 
                            nutritionProgress.caloriesPercent >= 50 ? 'bg-yellow-200' : 'bg-red-200'
                          }`}
                          style={{ width: `${Math.min(100, nutritionProgress.caloriesPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* --- Weekly Workouts List --- */}
          <section className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-500" /> אימונים השבוע
                </h2>
                {weeklyWorkouts.length > 0 && (
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium">
                    {weeklyWorkouts.filter(w => w.completed).length} / {weeklyWorkouts.length} הושלמו
                  </span>
                )}
            </div>
            
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100/50 dark:divide-slate-800/50">
                    {weeklyWorkouts.length > 0 ? (
                        weeklyWorkouts
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((workout, index) => {
                            const workoutDate = new Date(workout.date);
                            const dayName = workoutDate.toLocaleDateString("he-IL", { weekday: 'long' });
                            const formattedDate = workoutDate.toLocaleDateString("he-IL", { day: 'numeric', month: 'short' });
                            
                            // Calculate workout stats
                            const exerciseCount = workout.set_logs?.length || 0;
                            const uniqueExercises = new Set(workout.set_logs?.map(sl => sl.exercise_id) || []).size;
                            const maxWeight = workout.set_logs?.reduce((max, sl) => Math.max(max, sl.weight_kg || 0), 0) || 0;
                            
                            // Calculate duration if available
                            let duration: string | null = null;
                            if (workout.start_time && workout.end_time) {
                              const start = new Date(workout.start_time);
                              const end = new Date(workout.end_time);
                              const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
                              if (minutes > 0) {
                                duration = `${minutes} דק'`;
                              }
                            }
                            
                            const isToday = workoutDate.toDateString() === new Date().toDateString();
                            
                            return (
                              <div 
                                  key={workout.id} 
                                  onClick={() => setSelectedWorkoutDetail(workout)}
                                  className="flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all group animate-in fade-in slide-in-from-right-2 cursor-pointer"
                                  style={{ animationDelay: `${index * 50}ms` }}
                              >
                                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                      <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center border-2 flex-shrink-0 ${
                                        workout.completed 
                                          ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 border-emerald-300 dark:border-emerald-500/40 shadow-sm' 
                                          : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                                      }`}>
                                        {workout.completed ? (
                                          <CheckCircle2 className={`h-6 w-6 sm:h-7 sm:w-7 text-emerald-600 dark:text-emerald-400`} />
                                        ) : (
                                          <Dumbbell className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-400 dark:text-slate-500`} />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1.5">
                                            <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                              {workout.routine?.name || "אימון"}
                                            </p>
                                            {isToday && (
                                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                                                היום
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400">
                                              <span className="font-medium">{dayName}, {formattedDate}</span>
                                              {uniqueExercises > 0 && (
                                                <>
                                                  <span className="text-gray-300 dark:text-slate-600">•</span>
                                                  <span className="flex items-center gap-1">
                                                    <Activity className="h-3 w-3" />
                                                    {uniqueExercises} תרגילים
                                                  </span>
                                                </>
                                              )}
                                              {maxWeight > 0 && (
                                                <>
                                                  <span className="text-gray-300 dark:text-slate-600">•</span>
                                                  <span className="flex items-center gap-1">
                                                    <Zap className="h-3 w-3" />
                                                    {maxWeight.toFixed(0)} ק"ג
                                                  </span>
                                                </>
                                              )}
                                              {duration && (
                                                <>
                                                  <span className="text-gray-300 dark:text-slate-600">•</span>
                                                  <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {duration}
                                                  </span>
                                                </>
                                              )}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                      {workout.completed ? (
                                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-black border bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                          הושלם
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                          לא הושלם
                                        </span>
                                      )}
                                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
                                  </div>
                              </div>
                            );
                          })
                    ) : (
                        <div className="p-8 sm:p-10 text-center">
                          <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
                              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-slate-500" />
                            </div>
                          </div>
                          <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base font-medium mb-2">אין אימונים השבוע</p>
                          <p className="text-gray-400 dark:text-slate-500 text-xs sm:text-sm mb-6">התחל אימון כדי לראות את ההתקדמות שלך כאן</p>
                          <Link href="/trainee/workout" className="inline-block">
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white h-10 sm:h-11 px-5 sm:px-6">
                              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5" />
                              התחל אימון
                            </Button>
                          </Link>
                        </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* --- Quick Actions --- */}
          <section className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '250ms' }}>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1 mb-3">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-500" /> פעולות מהירות
            </h2>
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
              <CardContent className="p-0 divide-y divide-gray-100/50 dark:divide-slate-800/50">
                  {[
                    { title: "אימון יומי", desc: "התחל אימון חדש", icon: Dumbbell, href: "/trainee/workout", color: "blue" },
                    { title: "מעקב התקדמות", desc: "גרפים וסטטיסטיקות", icon: BarChart3, href: "/trainee/history", color: "purple" },
                    ...(stats.currentWeight === null || weightHistory.length === 0 || (weightHistory.length > 0 && new Date(weightHistory[0].date).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]) ? [
                      { title: "הוסף משקל", desc: "עדכן את משקל הגוף", icon: Scale, href: null, color: "gray", onClick: () => setShowWeightInput(true) }
                    ] : []),
                  ].map((item, index) => {
                    const colorClasses = {
                      blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
                      purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
                      gray: "bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400",
                    };
                    const iconColorClasses = {
                      blue: "text-blue-500",
                      purple: "text-purple-500",
                      gray: "text-gray-500",
                    };
                    
                    if (item.onClick) {
                      return (
                        <div 
                          key={index}
                          onClick={item.onClick}
                          className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all text-right group relative cursor-pointer"
                        >
                          <div className={`p-2.5 rounded-xl ${colorClasses[item.color as keyof typeof colorClasses]} group-hover:scale-105 transition-transform shadow-sm`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 z-10">
                            <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">{item.title}</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">{item.desc}</span>
                          </div>
                          <ArrowUpRight className={`h-5 w-5 ${iconColorClasses[item.color as keyof typeof iconColorClasses]} opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all`} />
                        </div>
                      );
                    }
                    
                    return (
                      <Link 
                        key={index}
                        href={item.href!}
                        className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all text-right group relative"
                      >
                        <div className={`p-2.5 rounded-xl ${colorClasses[item.color as keyof typeof colorClasses]} group-hover:scale-105 transition-transform shadow-sm`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 z-10">
                          <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">{item.title}</span>
                          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">{item.desc}</span>
                        </div>
                        <ArrowUpRight className={`h-5 w-5 ${iconColorClasses[item.color as keyof typeof iconColorClasses]} opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all`} />
                      </Link>
                    );
                  })}
                  
                  <Link href="/trainee/nutrition" className="block">
                     <div className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all text-right group relative">
                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all shadow-sm">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">מחשבון תזונה</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">המר בין מזונות</span>
                        </div>
                    </div>
                  </Link>
              </CardContent>
            </Card>
          </section>

      </div>

      {/* Weight Input Modal */}
      <WeightInputModal
        isOpen={showWeightInput}
        onClose={() => setShowWeightInput(false)}
        onSave={handleWeightSave}
      />

      {/* Workout Detail Dialog */}
      <Dialog open={!!selectedWorkoutDetail} onOpenChange={(open) => !open && setSelectedWorkoutDetail(null)}>
        <DialogContent className="w-full h-full sm:h-auto max-w-3xl max-h-[90vh] sm:max-h-[90vh] overflow-hidden mx-0 sm:mx-4 p-0 gap-0 rounded-none sm:rounded-lg">
          {selectedWorkoutDetail && (
            <>
              {/* Header with Gradient */}
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 p-4 sm:p-5 md:p-6 text-white">
                <DialogHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl flex-shrink-0">
                        <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <DialogTitle className="text-lg sm:text-xl md:text-2xl font-black text-white truncate">
                          {selectedWorkoutDetail.routine?.name || 'פרטי אימון'}
                        </DialogTitle>
                        <DialogDescription className="text-white/90 text-xs sm:text-sm md:text-base mt-1">
                          {new Date(selectedWorkoutDetail.date).toLocaleDateString('he-IL', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </DialogDescription>
                      </div>
                    </div>
                    {selectedWorkoutDetail.completed && (
                      <div className="bg-emerald-500/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg border border-emerald-300/30 flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    )}
                  </div>
                </DialogHeader>

                {/* Quick Stats */}
                {selectedWorkoutDetail.set_logs && selectedWorkoutDetail.set_logs.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4">
                    {(() => {
                      const uniqueExercises = new Set(selectedWorkoutDetail.set_logs!.map(s => s.exercise_id)).size;
                      const maxWeight = Math.max(...selectedWorkoutDetail.set_logs!.map(s => s.weight_kg || 0));
                      const totalSets = selectedWorkoutDetail.set_logs!.length;
                      let duration: string | null = null;
                      if (selectedWorkoutDetail.start_time && selectedWorkoutDetail.end_time) {
                        const start = new Date(selectedWorkoutDetail.start_time);
                        const end = new Date(selectedWorkoutDetail.end_time);
                        const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
                        if (minutes > 0) {
                          duration = `${minutes} דק'`;
                        }
                      }
                      
                      return (
                        <>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1">
                              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-[10px] sm:text-xs text-white/80">תרגילים</span>
                            </div>
                            <p className="text-base sm:text-lg md:text-xl font-black text-white">{uniqueExercises}</p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1">
                              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-[10px] sm:text-xs text-white/80">מקסימום</span>
                            </div>
                            <p className="text-base sm:text-lg md:text-xl font-black text-white">{maxWeight.toFixed(0)} ק"ג</p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1">
                              {duration ? <Clock className="h-3 w-3 sm:h-4 sm:w-4" /> : <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />}
                              <span className="text-[10px] sm:text-xs text-white/80">{duration ? 'משך' : 'סטים'}</span>
                            </div>
                            <p className="text-base sm:text-lg md:text-xl font-black text-white">{duration || totalSets}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[60vh] p-4 sm:p-5 md:p-6 bg-white dark:bg-slate-900">
                {selectedWorkoutDetail.set_logs && selectedWorkoutDetail.set_logs.length > 0 ? (
                  <div className="space-y-4">
                    {Array.from(new Set(selectedWorkoutDetail.set_logs.map(s => s.exercise_id))).map((exerciseId, exerciseIdx) => {
                      const exerciseSets = selectedWorkoutDetail.set_logs!.filter(s => s.exercise_id === exerciseId);
                      const exercise = exerciseSets[0]?.exercise;
                      const maxWeight = Math.max(...exerciseSets.map(s => s.weight_kg || 0));
                      const sortedSets = [...exerciseSets].sort((a, b) => (a.set_number || 0) - (b.set_number || 0));
                      
                      return (
                        <Card key={exerciseId} className="border-2 border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${exerciseIdx * 50}ms` }}>
                          <CardContent className="p-3 sm:p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                                  <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-900 dark:text-white truncate">
                                  {exercise?.name || 'תרגיל לא ידוע'}
                                </h3>
                              </div>
                              {maxWeight > 0 && (
                                <div className="flex items-center gap-1 sm:gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex-shrink-0">
                                  <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                    {maxWeight.toFixed(0)} ק"ג
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              {sortedSets.map((set, idx) => (
                                <div 
                                  key={set.id} 
                                  className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[10px] sm:text-xs font-black flex-shrink-0">
                                      {set.set_number || idx + 1}
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-x-auto">
                                      <div className="text-center min-w-[60px] sm:min-w-[70px]">
                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">משקל</p>
                                        <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white">{set.weight_kg.toFixed(0)} ק"ג</p>
                                      </div>
                                      <div className="w-px h-6 sm:h-8 bg-gray-300 dark:bg-slate-600 flex-shrink-0" />
                                      <div className="text-center min-w-[50px] sm:min-w-[60px]">
                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">חזרות</p>
                                        <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white">{set.reps}</p>
                                      </div>
                                      {set.rir_actual !== undefined && (
                                        <>
                                          <div className="w-px h-6 sm:h-8 bg-gray-300 dark:bg-slate-600 flex-shrink-0" />
                                          <div className="text-center min-w-[40px] sm:min-w-[50px]">
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">RIR</p>
                                            <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white">{set.rir_actual}</p>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {set.weight_kg === maxWeight && maxWeight > 0 && (
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                                      מקסימום
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
                      <Dumbbell className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 text-base font-medium">אין תרגילים באימון זה</p>
                  </div>
                )}
                
                {selectedWorkoutDetail.body_weight && (
                  <Card className="mt-3 sm:mt-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200">משקל גוף:</span>
                        <span className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-300">{selectedWorkoutDetail.body_weight.toFixed(1)} ק"ג</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedWorkoutDetail.notes && (
                  <Card className="mt-3 sm:mt-4 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200 mb-1">הערות:</p>
                          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap break-words">{selectedWorkoutDetail.notes}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


