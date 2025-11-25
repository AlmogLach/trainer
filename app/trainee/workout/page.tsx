"use client";

import { useState, useEffect, useMemo, memo, useCallback } from "react";
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

// --- Component: Simple Exercise Card ---

const ExerciseCard = memo(({ 
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
      "bg-card rounded-2xl p-5 border-2 transition-all",
      data.isComplete 
        ? "border-green-500 bg-green-500/5" 
        : "border-border"
    )}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-black text-foreground mb-1">{exercise.name}</h3>
          {exercise.specialInstructions && (
            <p className="text-xs text-muted-foreground">{exercise.specialInstructions}</p>
          )}
        </div>
        {data.isComplete && (
          <div className="bg-green-500 p-2 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      
      {/* Target Info */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Target className="w-4 h-4" />
          <span className="font-medium">{exercise.targetSets} סטים</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Dumbbell className="w-4 h-4" />
          <span className="font-medium">{exercise.targetReps} חזרות</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span className="font-medium">{exercise.restTime}s</span>
        </div>
      </div>

      {/* New Record Badge */}
      {beatPrevious && data.heaviestWeight && data.heaviestReps && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-xl text-sm font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          שיא חדש! 🔥
        </div>
      )}
      
      {/* Previous Best */}
      {exercise.previousBest && (
        <div className="bg-accent/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">שיא קודם:</p>
          <p className="text-sm font-bold text-foreground">
            {exercise.previousBest.weight} ק"ג × {exercise.previousBest.reps} חזרות
          </p>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground">התקדמות</span>
          <span className={cn(
            "text-sm font-black",
            isOverTarget ? "text-amber-500" : "text-primary"
          )}>
            {data.totalSetsDone} / {exercise.targetSets}
          </span>
        </div>
        <div className="h-2 bg-accent rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              isOverTarget 
                ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                : "bg-gradient-to-r from-primary to-primary/80"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Input Fields */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1 block">משקל</label>
          <input
            type="number"
            inputMode="decimal"
            value={data.heaviestWeight}
            onChange={(e) => onUpdate("heaviestWeight", e.target.value)}
            className="w-full h-12 bg-accent/30 border-2 border-border rounded-xl px-3 text-center text-lg font-bold text-foreground focus:border-primary focus:ring-0 transition-all"
            placeholder="0"
          />
        </div>
        
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1 block">חזרות</label>
          <input
            type="number"
            inputMode="numeric"
            value={data.heaviestReps}
            onChange={(e) => onUpdate("heaviestReps", e.target.value)}
            className="w-full h-12 bg-accent/30 border-2 border-border rounded-xl px-3 text-center text-lg font-bold text-foreground focus:border-primary focus:ring-0 transition-all"
            placeholder="0"
          />
        </div>
        
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-1 block">RIR</label>
          <input
            type="number"
            inputMode="numeric"
            value={data.heaviestRir}
            onChange={(e) => onUpdate("heaviestRir", e.target.value)}
            className="w-full h-12 bg-accent/30 border-2 border-border rounded-xl px-3 text-center text-lg font-bold text-foreground focus:border-primary focus:ring-0 transition-all"
            placeholder="0"
          />
        </div>
      </div>
      
      {/* Set Counter */}
      <div className="mb-4">
        <label className="text-xs font-bold text-muted-foreground mb-2 block">סטים שבוצעו</label>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onUpdate("totalSetsDone", Math.max(0, data.totalSetsDone - 1))}
            className="h-12 w-12 rounded-xl bg-accent hover:bg-accent/80 border-2 border-border transition-all active:scale-95"
            disabled={data.totalSetsDone === 0}
          >
            <Minus className="w-5 h-5 text-foreground" />
          </Button>
          
          <div className="flex-1 h-12 bg-primary/10 border-2 border-primary/30 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-black text-primary">{data.totalSetsDone}</span>
          </div>
          
          <Button
            onClick={() => onUpdate("totalSetsDone", data.totalSetsDone + 1)}
            className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 text-background" />
          </Button>
        </div>
      </div>
      
      {/* Complete Button */}
      <Button
        onClick={() => onUpdate("isComplete", !data.isComplete)}
        className={cn(
          "w-full h-12 rounded-xl font-black transition-all active:scale-98",
          data.isComplete
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background"
        )}
      >
        {data.isComplete ? (
          <>
            <CheckCircle2 className="w-5 h-5 ml-2" />
            הושלם ✓
          </>
        ) : (
          "סיימתי תרגיל"
        )}
      </Button>
    </div>
  );
});

ExerciseCard.displayName = 'ExerciseCard';

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

  useEffect(() => {
    if (selectedRoutine?.id && exercisesData && Object.keys(exercisesData).length > 0) {
      // Debounce localStorage writes to improve performance
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`workout_backup_${selectedRoutine.id}`, JSON.stringify(exercisesData));
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [exercisesData, selectedRoutine]);

  const loadWorkoutData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      
      // Load plan and routines in parallel
      const [plan, logs] = await Promise.all([
        getActiveWorkoutPlan(user.id),
        getWorkoutLogs(user.id, 10)
      ]);
      
      setWorkoutPlan(plan);

      if (!plan) {
        setLoading(false);
        return;
      }

      const routinesData = await getRoutinesWithExercises(plan.id);
      
      // Filter and sort routines with exercises
      const routinesWithExercises = routinesData
        .filter(r => r.routine_exercises && r.routine_exercises.length > 0)
        .sort((a, b) => {
          const letterOrder: any = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
          return (letterOrder[a.letter] || 99) - (letterOrder[b.letter] || 99);
        });
      
      setRoutines(routinesData.sort((a, b) => {
        const letterOrder: any = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
        return (letterOrder[a.letter] || 99) - (letterOrder[b.letter] || 99);
      }));

      if (routinesWithExercises.length === 0) {
        setLoading(false);
        return;
      }
      
      // Find next routine to show
      const lastLog = logs.find(log => log.date === new Date().toISOString().split('T')[0]);
      let routineToShow: RoutineWithExercises;
      
      if (lastLog) {
        const lastRoutineIndex = routinesWithExercises.findIndex(r => r.id === lastLog.routine_id);
        const nextIndex = lastRoutineIndex >= 0 && lastRoutineIndex < routinesWithExercises.length - 1
          ? lastRoutineIndex + 1
          : 0;
        routineToShow = routinesWithExercises[nextIndex];
      } else {
        routineToShow = routinesWithExercises[0];
      }

      setSelectedRoutine(routineToShow);
      await loadExercisesWithHistory(routineToShow, user.id, logs);
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesWithHistory = async (routine: RoutineWithExercises, traineeId: string, existingLogs?: any[]) => {
    try {
      // Use existing logs if provided to avoid duplicate fetch
      const allLogs = existingLogs || await getWorkoutLogs(traineeId, 50);
      
      const exercisesList: Exercise[] = routine.routine_exercises.map((re) => {
        const exerciseLogs = allLogs
          .flatMap(log => log.set_logs || [])
          .filter(sl => sl.exercise_id === re.exercise_id)
          .map(sl => ({
            weight: sl.weight_kg,
            reps: sl.reps,
          }))
          .sort((a, b) => b.weight - a.weight || b.reps - a.reps);

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

  const updateExerciseData = useCallback((exerciseId: string, field: keyof ExerciseData, value: any) => {
    setExercisesData(prev => {
      const newData = {
        ...prev,
        [exerciseId]: { ...prev[exerciseId], [field]: value }
      };
      
      if (field === 'isComplete' && value === true && !prev[exerciseId]?.isComplete) {
        const celebrationDiv = document.createElement('div');
        celebrationDiv.className = 'fixed inset-0 pointer-events-none z-40 flex items-center justify-center';
        celebrationDiv.innerHTML = '<div class="text-8xl animate-in zoom-in duration-500">🎉</div>';
        document.body.appendChild(celebrationDiv);
        setTimeout(() => celebrationDiv.remove(), 1000);
      }
      
      return newData;
    });
  }, []);

  const handleRoutineChange = async (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine);
    setShowRoutineSelector(false);
    setExercisesData({});
    await loadExercisesWithHistory(routine, user?.id || '');
  };

  const handleFinishWorkout = async () => {
    if (!selectedRoutine || !user?.id || exercises.length === 0) return;
    
    const hasValidData = Object.values(exercisesData).some(d => 
      d.totalSetsDone > 0 || (d.heaviestWeight && d.heaviestReps)
    );

    if (!hasValidData) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-24 left-4 right-4 z-50 bg-red-500/90 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 font-bold text-center';
      errorDiv.innerHTML = '⚠️ לא ניתן לסיים אימון ריק. אנא מלא לפחות תרגיל אחד.';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
      return;
    }

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

      for (const exercise of exercises) {
        const data = exercisesData[exercise.id];
        if (!data || data.totalSetsDone === 0) continue;

        const weight = parseFloat(data.heaviestWeight) || 0;
        const reps = parseInt(data.heaviestReps) || 0;
        
        for (let i = 1; i <= data.totalSetsDone; i++) {
           await createSetLog({
             log_id: workoutLog.id,
             exercise_id: exercise.exerciseId,
             set_number: i,
             weight_kg: weight,
             reps: reps,
             rir_actual: 2,
             notes: i === 1 ? "Top Set" : "Volume Set",
           });
        }
      }

      localStorage.removeItem(`workout_backup_${selectedRoutine.id}`);
      
      // Prepare data for summary page
      const summaryData = {
        exercises: exercises.map(exercise => {
          const data = exercisesData[exercise.id];
          const sets = [];
          for (let i = 1; i <= data.totalSetsDone; i++) {
            sets.push({
              setNumber: i,
              weight: data.heaviestWeight,
              reps: data.heaviestReps,
              rir: data.heaviestRir
            });
          }
          return {
            ...exercise,
            sets,
            muscleGroup: 'כללי',
            exerciseId: exercise.exerciseId,
            previousPerformance: exercise.previousBest ? [exercise.previousBest] : []
          };
        }),
        routine: selectedRoutine,
        startTime: startTime
      };
      
      sessionStorage.setItem('workoutSummaryData', JSON.stringify(summaryData));
      
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-24 left-4 right-4 z-50 bg-green-500/90 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in zoom-in duration-300 font-bold text-center';
      successDiv.innerHTML = '✅ האימון נשמר בהצלחה! מעביר לסיכום...';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        window.location.href = '/trainee/workout/summary';
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

  const progress = useMemo(() => {
    if (exercises.length === 0) return 0;
    const completed = Object.values(exercisesData).filter(d => d.isComplete).length;
    return Math.round((completed / exercises.length) * 100);
  }, [exercises, exercisesData]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
          </div>
          <div>
            <p className="text-xl font-black text-foreground animate-pulse">טוען אימון...</p>
            <p className="text-sm text-muted-foreground mt-1">מכין את התרגילים שלך</p>
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

  if (!workoutPlan || routines.length === 0 || !selectedRoutine || exercises.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <Dumbbell className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-black mb-3 text-foreground">אין אימון זמין</h1>
        <p className="text-muted-foreground max-w-sm mb-6">
          {!workoutPlan && "המאמן שלך עדיין לא יצר תוכנית אימונים פעילה."}
          {workoutPlan && routines.length === 0 && "תוכנית האימונים לא מכילה רוטינות."}
          {workoutPlan && routines.length > 0 && !selectedRoutine && "לא נמצאה רוטינה מתאימה."}
          {workoutPlan && routines.length > 0 && selectedRoutine && exercises.length === 0 && "הרוטינה לא מכילה תרגילים."}
        </p>
        <Link href="/trainee/dashboard">
          <Button className="gap-2">
            חזרה לדף הבית <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-32" dir="rtl">
      
      {/* Header - Connected to top header */}
      <div className="bg-gradient-to-r from-card to-card/95 border-b-2 border-border rounded-b-2xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-primary p-2 sm:p-2.5 rounded-lg sm:rounded-xl">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-foreground">FitLog</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Workout Tracker</p>
            </div>
          </div>
          
          <Link href="/trainee/dashboard">
            <Button variant="outline" size="icon" className="rounded-lg sm:rounded-xl h-9 w-9 sm:h-10 sm:w-10">
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>

        {/* Workout Info */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-border">
          <div className="flex items-center justify-between mb-3">
            <div onClick={() => setShowRoutineSelector(!showRoutineSelector)} className="cursor-pointer flex-1">
              <span className="text-xs text-primary font-bold uppercase mb-1 block">אימון היום</span>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">{workoutPlan.name}</h2>
                <span className="bg-foreground text-background text-xs font-bold px-2.5 py-1 rounded-lg">{selectedRoutine.letter}</span>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  showRoutineSelector && 'rotate-180'
                )} />
              </div>
            </div>
            
            {/* Progress Circle */}
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="none" className="text-accent" />
                <circle
                  cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="none"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                  className="text-primary transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-foreground">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            <div className="flex-1 bg-orange-500/10 rounded-xl p-3 flex items-center gap-2 border border-orange-500/20">
              <div className="bg-orange-500 p-1.5 rounded-lg">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium">תרגילים</span>
                <span className="block text-lg font-black text-foreground">
                  {Object.values(exercisesData).filter(d => d.isComplete).length}/{exercises.length}
                </span>
              </div>
            </div>
            <div className="flex-1 bg-blue-500/10 rounded-xl p-3 flex items-center gap-2 border border-blue-500/20">
              <div className="bg-blue-500 p-1.5 rounded-lg">
                <Timer className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium">זמן</span>
                <span className="block text-lg font-black text-foreground">
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content with padding */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Routine Selector */}
      {showRoutineSelector && (
         <div 
           className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" 
           onClick={() => setShowRoutineSelector(false)}
         >
            <div 
              className="fixed top-32 left-4 right-4 z-40 bg-card rounded-2xl p-4 shadow-2xl border-2 border-border"
              onClick={(e) => e.stopPropagation()}
            >
               <h3 className="text-lg font-black text-foreground mb-3">בחר אימון</h3>
               {routines
                 .filter(routine => routine.routine_exercises && routine.routine_exercises.length > 0)
                 .map((routine) => (
                  <button
                    key={routine.id}
                    onClick={() => handleRoutineChange(routine)}
                    className={cn(
                        "w-full text-right p-3 rounded-xl font-bold flex items-center justify-between mb-2 transition-all",
                        selectedRoutine.id === routine.id 
                          ? "bg-primary text-white" 
                          : "bg-accent text-foreground hover:bg-accent/80"
                    )}
                  >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-black",
                          selectedRoutine.id === routine.id ? "bg-white/20" : "bg-foreground/10"
                        )}>
                          {routine.letter}
                        </span>
                        <span>{routine.name}</span>
                      </div>
                      {selectedRoutine.id === routine.id && <CheckCircle2 className="w-5 h-5" />}
                  </button>
               ))}
            </div>
         </div>
      )}

      {/* Exercises */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {exercises.map((exercise, index) => {
          const data = exercisesData[exercise.id] || { 
             heaviestWeight: "", heaviestReps: "", heaviestRir: "1", totalSetsDone: 0, isComplete: false 
          };
          
          return (
            <div key={exercise.id}>
              <ExerciseCard
                 exercise={exercise}
                 data={data}
                 onUpdate={(field, value) => updateExerciseData(exercise.id, field, value)}
              />
            </div>
          );
        })}
        
        {/* Success Message */}
        {exercises.length > 0 && Object.values(exercisesData).every(d => d.isComplete) && (
          <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-black text-foreground mb-1">עבודה מדהימה!</h3>
            <p className="text-sm text-muted-foreground">סיימת את כל התרגילים!</p>
          </div>
        )}
      </div>

      {/* Finish Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 z-20">
        <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleFinishWorkout}
              disabled={saving}
              className={cn(
                "w-full h-14 rounded-2xl font-black text-lg transition-all",
                progress === 100 
                  ? "bg-green-500 hover:bg-green-600 text-white" 
                  : "bg-primary hover:bg-primary/90 text-white",
                saving && "opacity-80"
              )}
            >
              {saving ? (
                 <div className="flex items-center gap-2">
                   <Loader2 className="h-5 w-5 animate-spin" />
                   <span>שומר...</span>
                 </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <span>{progress === 100 ? "סיום אימון 🎉" : "סיום אימון"}</span>
                </div>
              )}
            </Button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function WorkoutPage() {
  return <WorkoutPageContent />;
}
