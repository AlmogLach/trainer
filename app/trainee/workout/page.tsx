"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  ArrowRight, 
  ChevronDown, 
  CheckCircle2, 
  Dumbbell, 
  Trophy, 
  CalendarDays, 
  Timer,
  Target,
  Flame,
  Minus,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActiveWorkoutPlan,
  getRoutinesWithExercises,
  getWorkoutLogs,
  createWorkoutLog,
  createSetLog,
} from "@/lib/db";
import type { RoutineWithExercises } from "@/lib/types";
import { cn } from "@/lib/utils";
// import { useWorkoutPersistence } from "@/hooks/useWorkoutPersistence"; // Commented out as data structure changed

// --- Types ---

interface ExerciseData {
  heaviestWeight: string;
  heaviestReps: string;
  heaviestRir: string;
  totalSetsDone: number;
  isComplete: boolean;
}

interface Exercise {
  id: string;
  name: string;
  specialInstructions: string;
  targetSets: number;
  targetReps: string;
  restTime: number;
  exerciseId: string;
  previousBest?: { weight: number; reps: number };
}

// --- Component: PerformanceExerciseCard (Enhanced Design) ---

const PerformanceExerciseCard = ({ 
  exercise, 
  data, 
  onUpdate 
}: { 
  exercise: Exercise; 
  data: ExerciseData; 
  onUpdate: (field: keyof ExerciseData, value: any) => void; 
}) => {
  
  const progressPercentage = Math.min(100, (data.totalSetsDone / exercise.targetSets) * 100);
  const isOverTarget = data.totalSetsDone > exercise.targetSets;
  
  // Check if user beat previous best
  const currentWeight = parseFloat(data.heaviestWeight) || 0;
  const currentReps = parseInt(data.heaviestReps) || 0;
  const beatPrevious = exercise.previousBest && (
    currentWeight > exercise.previousBest.weight || 
    (currentWeight === exercise.previousBest.weight && currentReps > exercise.previousBest.reps)
  );

  return (
    <div className={cn(
      "relative bg-card rounded-[2rem] p-6 shadow-md border-2 transition-all duration-500 overflow-hidden",
      data.isComplete 
        ? "border-primary shadow-primary/30 shadow-xl scale-[1.02]" 
        : "border-border hover:shadow-lg"
    )}>
      
      {/* Animated Background Decor */}
      <div className={cn(
        "absolute top-0 right-0 w-40 h-40 rounded-bl-full -z-0 transition-all duration-700",
        data.isComplete 
          ? "bg-primary/20 scale-150" 
          : "bg-accent/40 scale-100"
      )} />
      
      {/* Beat Previous Badge */}
      {beatPrevious && data.heaviestWeight && data.heaviestReps && (
        <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide shadow-lg animate-pulse flex items-center gap-1">
          <Trophy className="w-3 h-3 fill-current" />
          שיא חדש! 🔥
        </div>
      )}
      
      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-black text-foreground leading-tight mb-2">{exercise.name}</h3>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground flex-wrap">
              <span className="bg-accent px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                {exercise.targetSets} סטים
              </span>
              <span className="bg-accent px-2.5 py-1 rounded-lg">
                {exercise.targetReps} חזרות
              </span>
              <span className="bg-accent px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                {Math.floor(exercise.restTime / 60)}:{(exercise.restTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* Previous Best Badge */}
          {exercise.previousBest && (
            <div className="flex flex-col items-end bg-accent/50 px-3 py-2 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">שיא קודם</span>
              <div className="flex items-baseline gap-1 text-primary font-bold">
                <span className="text-lg">{exercise.previousBest.weight}</span>
                <span className="text-xs">kg</span>
                <span className="text-muted-foreground mx-0.5">×</span>
                <span className="text-lg">{exercise.previousBest.reps}</span>
              </div>
            </div>
          )}
        </div>

        {/* Special Instructions */}
        {exercise.specialInstructions && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2">
            <div className="bg-blue-500/20 p-1 rounded-lg mt-0.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-blue-100 leading-relaxed flex-1">{exercise.specialInstructions}</p>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-4 relative z-10">
        
        {/* Top Set Input with Enhanced Design */}
        <div className="col-span-2 bg-gradient-to-br from-accent/40 to-accent/20 rounded-2xl p-5 border-2 border-border/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-500/20 p-1.5 rounded-lg">
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-black text-foreground uppercase tracking-wide">הסט הכי כבד היום</span>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5 text-center">משקל</label>
              <div className="relative">
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={data.heaviestWeight}
                  onChange={(e) => onUpdate('heaviestWeight', e.target.value)}
                  placeholder="0"
                  className={cn(
                    "w-full bg-background h-20 rounded-2xl text-center text-4xl font-black text-foreground border-3 transition-all outline-none shadow-sm placeholder:text-muted-foreground/30",
                    data.heaviestWeight 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border/50 focus:border-primary"
                  )}
                />
                <span className="absolute bottom-3 right-1/2 translate-x-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  ק"ג
                </span>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5 text-center">חזרות</label>
              <div className="relative">
                <input 
                  type="number" 
                  inputMode="numeric"
                  value={data.heaviestReps}
                  onChange={(e) => onUpdate('heaviestReps', e.target.value)}
                  placeholder="0"
                  className={cn(
                    "w-full bg-background h-20 rounded-2xl text-center text-4xl font-black text-foreground border-3 transition-all outline-none shadow-sm placeholder:text-muted-foreground/30",
                    data.heaviestReps 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border/50 focus:border-primary"
                  )}
                />
                <span className="absolute bottom-3 right-1/2 translate-x-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  reps
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Volume Counter & Status */}
        <div className="col-span-2 flex items-center justify-between gap-4 mt-2">
          
          {/* Enhanced Set Counter with Animation */}
          <div className="flex items-center gap-3 bg-background border-2 border-border/50 rounded-2xl p-2 shadow-sm">
            <button 
              onClick={() => onUpdate('totalSetsDone', Math.max(0, data.totalSetsDone - 1))}
              disabled={data.totalSetsDone === 0}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center w-20">
              <span className={cn(
                "text-3xl font-black leading-none transition-all duration-300",
                isOverTarget ? "text-primary animate-pulse" : "text-foreground"
              )}>
                {data.totalSetsDone}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                {isOverTarget ? (
                  <span className="text-primary animate-pulse">+{data.totalSetsDone - exercise.targetSets} נוסף 🔥</span>
                ) : (
                  'סטים'
                )}
              </span>
            </div>

            <button 
              onClick={() => onUpdate('totalSetsDone', data.totalSetsDone + 1)}
              className={cn(
                "w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90",
                data.totalSetsDone >= exercise.targetSets
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-primary/15 text-primary hover:bg-primary/25"
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Enhanced Complete Toggle */}
          <button
            onClick={() => onUpdate('isComplete', !data.isComplete)}
            className={cn(
              "flex-1 h-14 rounded-2xl flex items-center justify-center gap-2.5 font-black text-base transition-all active:scale-95 shadow-md",
              data.isComplete 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/30 shadow-lg" 
                : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
            )}
          >
            {data.isComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>הושלם! ✓</span>
              </>
            ) : (
              <>
                <span>סמן כבוצע</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>

      {/* Enhanced Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-accent/20 overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-700 relative",
            isOverTarget 
              ? "bg-gradient-to-r from-primary via-amber-500 to-orange-500" 
              : "bg-gradient-to-r from-primary/60 to-primary"
          )}
          style={{ width: `${progressPercentage}%` }}
        >
          {progressPercentage > 0 && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---

function WorkoutPageContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithExercises | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // New Data Structure State
  const [exercisesData, setExercisesData] = useState<Record<string, ExerciseData>>({});
  
  // UI State
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [startTime] = useState(new Date().toISOString());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      setElapsedTime(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (user?.id) {
      loadWorkoutData();
    }
  }, [user?.id]);

  // Note: Previous persistence hook logic removed as data structure changed.
  // Ideally, implemented a simple local storage save here for `exercisesData`.
  useEffect(() => {
    if (selectedRoutine?.id && exercisesData && Object.keys(exercisesData).length > 0) {
       localStorage.setItem(`workout_backup_${selectedRoutine.id}`, JSON.stringify(exercisesData));
    }
  }, [exercisesData, selectedRoutine]);

  const loadWorkoutData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const plan = await getActiveWorkoutPlan(user.id);
      setWorkoutPlan(plan);

      if (!plan) {
        setLoading(false);
        return;
      }

      const routinesData = await getRoutinesWithExercises(plan.id);
      const sortedRoutines = [...routinesData].sort((a, b) => {
        const letterOrder: any = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
        return (letterOrder[a.letter] || 99) - (letterOrder[b.letter] || 99);
      });
      
      setRoutines(sortedRoutines);

      if (sortedRoutines.length > 0) {
        const logs = await getWorkoutLogs(user.id, 10);
        const lastLog = logs.find(log => log.date === new Date().toISOString().split('T')[0]);
        
        let routineToShow: RoutineWithExercises;
        if (lastLog) {
          const lastRoutineIndex = sortedRoutines.findIndex(r => r.id === lastLog.routine_id);
          const nextIndex = lastRoutineIndex >= 0 && lastRoutineIndex < sortedRoutines.length - 1
            ? lastRoutineIndex + 1
            : 0;
          routineToShow = sortedRoutines[nextIndex];
        } else {
          routineToShow = sortedRoutines[0];
        }

        setSelectedRoutine(routineToShow);
        await loadExercisesWithHistory(routineToShow, user.id);
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesWithHistory = async (routine: RoutineWithExercises, traineeId: string) => {
    try {
      const allLogs = await getWorkoutLogs(traineeId, 50);
      
      const exercisesList: Exercise[] = routine.routine_exercises.map((re) => {
        const exerciseLogs = allLogs
          .flatMap(log => log.set_logs || [])
          .filter(sl => sl.exercise_id === re.exercise_id)
          .map(sl => ({
            weight: sl.weight_kg,
            reps: sl.reps,
          }))
          .sort((a, b) => b.weight - a.weight || b.reps - a.reps); // Sort by best performance

        const previousPerformance = exerciseLogs.length > 0 ? exerciseLogs[0] : undefined;

        return {
          id: re.id,
          name: re.exercise?.name || 'תרגיל לא ידוע',
          specialInstructions: re.special_instructions || re.notes || '',
          targetSets: re.target_sets,
          targetReps: `${re.target_reps_min}-${re.target_reps_max}`,
          restTime: re.rest_time_seconds || 180,
          exerciseId: re.exercise_id,
          previousBest: previousPerformance,
        };
      });

      setExercises(exercisesList);
      initializeExercisesData(exercisesList, routine.id);

    } catch (error) {
      console.error('Error loading exercise history:', error);
    }
  };

  const initializeExercisesData = (exercisesList: Exercise[], routineId: string) => {
    // Try restore backup first
    const saved = localStorage.getItem(`workout_backup_${routineId}`);
    if (saved) {
      try {
        setExercisesData(JSON.parse(saved));
        return;
      } catch (e) {
        console.error("Failed to restore backup");
      }
    }

    const initialData: Record<string, ExerciseData> = {};
    exercisesList.forEach((exercise) => {
      // Pre-fill with previous best if available? Or keep empty. keeping empty for now.
      initialData[exercise.id] = {
        heaviestWeight: "",
        heaviestReps: "",
        heaviestRir: "1",
        totalSetsDone: 0,
        isComplete: false
      };
    });
    setExercisesData(initialData);
  };

  const updateExerciseData = (exerciseId: string, field: keyof ExerciseData, value: any) => {
    setExercisesData(prev => {
      const newData = {
        ...prev,
        [exerciseId]: { ...prev[exerciseId], [field]: value }
      };
      
      // Show celebration when marking as complete
      if (field === 'isComplete' && value === true && !prev[exerciseId]?.isComplete) {
        // Create confetti effect
        const celebrationDiv = document.createElement('div');
        celebrationDiv.className = 'fixed inset-0 pointer-events-none z-40 flex items-center justify-center';
        celebrationDiv.innerHTML = '<div class="text-8xl animate-in zoom-in duration-500">🎉</div>';
        document.body.appendChild(celebrationDiv);
        setTimeout(() => celebrationDiv.remove(), 1000);
      }
      
      return newData;
    });
  };

  const handleRoutineChange = async (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine);
    setShowRoutineSelector(false);
    setExercisesData({});
    await loadExercisesWithHistory(routine, user?.id || '');
  };

  const handleFinishWorkout = async () => {
    if (!selectedRoutine || !user?.id || exercises.length === 0) return;
    
    // Check if at least one exercise has valid data
    const hasValidData = Object.values(exercisesData).some(d => 
      d.totalSetsDone > 0 || (d.heaviestWeight && d.heaviestReps)
    );

    if (!hasValidData) {
      // Better error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-24 left-4 right-4 z-50 bg-red-500/90 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 font-bold text-center';
      errorDiv.innerHTML = '⚠️ לא ניתן לסיים אימון ריק. אנא מלא לפחות תרגיל אחד.';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
      return;
    }

    // Check if user wants to finish with incomplete exercises
    const incompleteCount = exercises.length - Object.values(exercisesData).filter(d => d.isComplete).length;
    if (incompleteCount > 0 && progress < 100) {
      const confirmed = confirm(`יש לך ${incompleteCount} תרגילים שלא סומנו כהושלמו. האם אתה בטוח שברצונך לסיים?`);
      if (!confirmed) return;
    }

    try {
      setSaving(true);
      const workoutLog = await createWorkoutLog({
        user_id: user.id,
        routine_id: selectedRoutine.id,
        date: new Date().toISOString().split('T')[0],
        body_weight: null,
        start_time: startTime,
        end_time: new Date().toISOString(),
        notes: null,
        completed: true,
      });

      // Save logic: Loop through exercises
      for (const exercise of exercises) {
        const data = exercisesData[exercise.id];
        if (!data || data.totalSetsDone === 0) continue;

        const weight = parseFloat(data.heaviestWeight) || 0;
        const reps = parseInt(data.heaviestReps) || 0;
        
        // Loop for Total Sets Done
        // Strategy: First set gets the real data. Rest get copied data (to maintain volume stats in DB)
        for (let i = 1; i <= data.totalSetsDone; i++) {
           await createSetLog({
             log_id: workoutLog.id,
             exercise_id: exercise.exerciseId,
             set_number: i,
             weight_kg: weight,
             reps: reps,
             rir_actual: 2, // Default RIR
             notes: i === 1 ? "Top Set" : "Volume Set",
           });
        }
      }

      localStorage.removeItem(`workout_backup_${selectedRoutine.id}`);
      
      // Success message before redirect
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-24 left-4 right-4 z-50 bg-green-500/90 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in zoom-in duration-300 font-bold text-center';
      successDiv.innerHTML = '✅ האימון נשמר בהצלחה! מעביר לסיכום...';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        window.location.href = `/trainee/workout/summary?logId=${workoutLog.id}`;
      }, 1000);
      
    } catch (error: any) {
      console.error('Error finishing workout:', error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-24 left-4 right-4 z-50 bg-red-500/90 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 font-bold text-center';
      errorDiv.innerHTML = `❌ שגיאה בשמירת האימון: ${error.message}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 4000);
    } finally {
      setSaving(false);
    }
  };

  // --- Calculate Progress ---
  const progress = useMemo(() => {
    if (exercises.length === 0) return 0;
    const completed = Object.values(exercisesData).filter(d => d.isComplete).length;
    return Math.round((completed / exercises.length) * 100);
  }, [exercises, exercisesData]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background" dir="rtl">
        {/* Skeleton Top Bar */}
        <div className="bg-card px-6 pt-safe pb-6 rounded-b-[2.5rem] shadow-lg mb-6">
          <div className="flex justify-between items-start mb-6 pt-4">
            <div className="flex-1">
              <div className="h-4 w-24 bg-accent/50 rounded-lg mb-2 animate-pulse" />
              <div className="h-8 w-48 bg-accent/50 rounded-lg animate-pulse" />
            </div>
            <div className="w-16 h-16 bg-accent/50 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 h-20 bg-accent/30 rounded-2xl animate-pulse" />
            <div className="flex-1 h-20 bg-accent/30 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Skeleton Exercise Cards */}
        <div className="px-5 space-y-5 max-w-2xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-[2rem] p-6 shadow-sm border-2 border-border animate-pulse">
              <div className="h-6 w-40 bg-accent/50 rounded-lg mb-4" />
              <div className="h-32 w-full bg-accent/30 rounded-2xl mb-4" />
              <div className="flex gap-4">
                <div className="h-14 w-32 bg-accent/30 rounded-xl" />
                <div className="flex-1 h-14 bg-accent/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Loading Indicator Overlay */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-card/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-border/50">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10 mx-auto" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-black text-foreground animate-pulse">מכין את האימון שלך...</p>
              <p className="text-sm text-muted-foreground">טוען תרגילים ונתונים היסטוריים</p>
            </div>
            <div className="flex gap-2 justify-center mt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workoutPlan || routines.length === 0 || !selectedRoutine || exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="bg-gradient-to-br from-accent/30 to-accent/10 p-8 rounded-3xl mb-6 shadow-lg border-2 border-border/50 animate-in zoom-in duration-500">
          <Dumbbell className="h-16 w-16 text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-black mb-3 text-foreground">אין אימון זמין</h1>
        <p className="text-muted-foreground max-w-sm mb-8 text-lg leading-relaxed">
          המאמן שלך עדיין לא יצר תוכנית אימונים פעילה. צור קשר איתו להתחלת התוכנית! 💪
        </p>
        <Link href="/trainee/dashboard">
          <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl font-bold text-base hover:bg-accent transition-all active:scale-95 shadow-md">
            חזרה לדף הבית <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full font-sans" dir="rtl">
      
      {/* --- Enhanced Top Bar with FitLog Branding --- */}
      <div className="bg-gradient-to-br from-card via-card to-accent/10 px-6 pt-safe pb-6 rounded-b-[2.5rem] shadow-lg mb-6 relative overflow-hidden">
        {/* Animated Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/30 rounded-full blur-2xl -z-10 -translate-x-1/2 translate-y-1/2" />
        
        {/* FitLog Logo Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-2xl shadow-lg">
              <Dumbbell className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">FitLog</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Workout Tracker</p>
            </div>
          </div>
          
          <Link href="/trainee/dashboard">
            <div className="bg-background p-2.5 rounded-2xl shadow-md border border-border hover:bg-accent/50 transition-all active:scale-95">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        {/* Workout Info Section */}
        <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div onClick={() => setShowRoutineSelector(!showRoutineSelector)} className="cursor-pointer flex-1">
              <span className="text-primary font-bold tracking-wider text-xs uppercase mb-1 block">אימון היום</span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black text-foreground">{workoutPlan.name}</h2>
                <span className="bg-gradient-to-br from-foreground to-foreground/80 text-background text-xs font-bold px-3 py-1.5 rounded-xl shadow-md">{selectedRoutine.letter}</span>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-300",
                  showRoutineSelector && 'rotate-180'
                )} />
              </div>
            </div>
            
            {/* Circular Progress Indicator */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-accent/30"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                  className={cn(
                    "transition-all duration-700 ease-out",
                    progress === 100 ? "text-primary" : "text-primary/70"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-foreground">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Row */}
          <div className="flex gap-3">
          <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 rounded-2xl p-3.5 flex items-center gap-3 border border-orange-200/50 dark:border-orange-800/30 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wide">תרגילים</span>
              <span className="block text-xl font-black text-foreground leading-tight">
                {Object.values(exercisesData).filter(d => d.isComplete).length}/{exercises.length}
              </span>
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-2xl p-3.5 flex items-center gap-3 border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wide">זמן אימון</span>
              <span className="block text-xl font-black text-foreground leading-tight tabular-nums">
                {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* --- Enhanced Routine Selector Dropdown --- */}
      {showRoutineSelector && (
         <div 
           className="fixed inset-0 bg-black/70 z-30 backdrop-blur-sm animate-in fade-in duration-200" 
           onClick={() => setShowRoutineSelector(false)}
         >
            <div 
              className="fixed top-[150px] left-4 right-4 z-40 bg-card rounded-3xl p-4 shadow-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300 border-2 border-border/50"
              onClick={(e) => e.stopPropagation()}
            >
               <h3 className="text-lg font-black text-foreground mb-3 px-2">בחר אימון</h3>
               {routines.map((routine, index) => (
                  <button
                    key={routine.id}
                    onClick={() => handleRoutineChange(routine)}
                    className={cn(
                        "w-full text-right p-4 rounded-2xl font-bold flex items-center justify-between mb-2 transition-all duration-200 active:scale-98",
                        selectedRoutine.id === routine.id 
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25" 
                          : "hover:bg-accent text-foreground bg-accent/30"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg",
                          selectedRoutine.id === routine.id 
                            ? "bg-white/20" 
                            : "bg-foreground/10"
                        )}>
                          {routine.letter}
                        </span>
                        <span className="text-base">{routine.name}</span>
                      </div>
                      {selectedRoutine.id === routine.id && (
                        <CheckCircle2 className="w-6 h-6 animate-in zoom-in duration-200" />
                      )}
                  </button>
               ))}
            </div>
         </div>
      )}

      {/* --- Main Content (Exercises) --- */}
      <div className="px-5 space-y-5 max-w-2xl mx-auto">
        {/* Welcome hint for first exercise */}
        {exercises.length > 0 && Object.values(exercisesData).every(d => !d.isComplete && d.totalSetsDone === 0) && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 p-2 rounded-xl">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-black text-foreground mb-1">בואו נתחיל! 💪</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  מלא את המשקל והחזרות של הסט הכבד ביותר שלך בכל תרגיל. ספור את מספר הסטים שביצעת וסמן כהושלם.
                </p>
              </div>
            </div>
          </div>
        )}

        {exercises.map((exercise, index) => {
          const data = exercisesData[exercise.id] || { 
             heaviestWeight: "", heaviestReps: "", heaviestRir: "1", totalSetsDone: 0, isComplete: false 
          };
          
          return (
            <div 
              key={exercise.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <PerformanceExerciseCard
                 exercise={exercise}
                 data={data}
                 onUpdate={(field, value) => updateExerciseData(exercise.id, field, value)}
              />
            </div>
          );
        })}
        
        {/* Motivational message when all complete */}
        {exercises.length > 0 && Object.values(exercisesData).every(d => d.isComplete) && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 rounded-2xl p-5 text-center animate-in zoom-in duration-500">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-black text-foreground mb-2">עבודה מדהימה!</h3>
            <p className="text-muted-foreground mb-4">סיימת את כל התרגילים. זמן לסיים את האימון!</p>
          </div>
        )}
        
        {/* Bottom padding for dock and navbar */}
        <div className="h-32" />
      </div>

      {/* --- Enhanced Floating Action Dock --- */}
      <div className="fixed bottom-20 left-0 right-0 p-4 z-20">
        <div className="max-w-2xl mx-auto">
            {/* Progress hint when not complete */}
            {progress < 100 && progress > 0 && (
              <div className="text-center mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-sm font-bold text-muted-foreground">
                  עוד {exercises.length - Object.values(exercisesData).filter(d => d.isComplete).length} תרגילים לסיום 💪
                </p>
              </div>
            )}
            
            <Button
              onClick={handleFinishWorkout}
              disabled={saving}
              className={cn(
                "w-full h-16 rounded-[2rem] flex items-center justify-between px-6 transition-all duration-500 shadow-2xl relative overflow-hidden group",
                progress === 100 
                  ? "bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white hover:from-green-500 hover:via-emerald-500 hover:to-green-500 animate-pulse" 
                  : "bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:from-primary/90 hover:to-primary/80",
                saving && "opacity-80 cursor-not-allowed"
              )}
            >
              {/* Animated background effect */}
              {progress === 100 && !saving && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
              
              {saving ? (
                 <div className="flex items-center gap-3 w-full justify-center relative z-10">
                   <Loader2 className="h-6 w-6 animate-spin" />
                   <span className="font-black text-lg">שומר נתונים...</span>
                 </div>
              ) : (
                <>
                  <div className="flex flex-col items-start relative z-10">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider mb-0.5",
                      progress === 100 ? "text-white/80" : "text-primary-foreground/70"
                    )}>
                      {progress === 100 ? "כל הכבוד! 🎉" : "סיום אימון"}
                    </span>
                    <span className={cn(
                      "font-black tracking-wide text-xl",
                      progress === 100 ? "text-white" : "text-primary-foreground"
                    )}>
                      {progress === 100 ? "COMPLETE WORKOUT" : "FINISH WORKOUT"}
                    </span>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 group-hover:scale-110 relative z-10",
                    progress === 100 ? "bg-white/30" : "bg-white/20"
                  )}>
                    <Trophy className={cn(
                      "w-6 h-6 transition-all",
                      progress === 100 ? "text-yellow-300 animate-bounce" : "text-white"
                    )} />
                  </div>
                </>
              )}
            </Button>
        </div>
      </div>


    </div>
  );
}

export default function WorkoutPage() {
  return <WorkoutPageContent />;
}