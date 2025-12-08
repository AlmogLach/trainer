"use client";

import { useState, useEffect, useMemo, memo, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  ArrowLeft, 
  ChevronDown, 
  CheckCircle2, 
  Dumbbell, 
  Trophy, 
  Timer,
  Target,
  Flame,
  Copy,
  RotateCcw,
  X,
  Bell
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  getActiveWorkoutPlan,
  getRoutinesWithExercises,
  getWorkoutLogs,
  createWorkoutLog,
  createSetLog,
} from "@/lib/db";
import type { RoutineWithExercises } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

// --- Types ---

interface ExerciseData {
  weight: string;
  reps: string;
  rir: string;
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

// --- Component: Enhanced Exercise Card ---

const ExerciseCard = memo(({ 
  exercise, 
  data, 
  onUpdate,
  onCopyPreviousWorkout,
  onClearExercise
}: { 
  exercise: Exercise; 
  data: ExerciseData; 
  onUpdate: (field: keyof ExerciseData, value: any) => void;
  onCopyPreviousWorkout: () => void;
  onClearExercise: () => void;
}) => {
  
  const currentWeight = parseFloat(data.weight) || 0;
  const currentReps = parseInt(data.reps) || 0;
  
  const beatPrevious = exercise.previousBest && currentWeight > 0 && (
    currentWeight > exercise.previousBest.weight || 
    (currentWeight === exercise.previousBest.weight && currentReps > exercise.previousBest.reps)
  );

  const hasData = data.weight && data.reps;

  return (
    <div className={cn(
      "bg-[#2D3142] rounded-2xl p-5 border-2 transition-all",
      data.isComplete 
        ? "border-[#4CAF50]" 
        : "border-transparent"
    )}>
      
      {/* Header: Exercise Name with Complete Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-outfit font-bold text-white">{exercise.name}</h3>
            {data.isComplete && (
              <div className="bg-[#4CAF50] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-outfit font-semibold text-white">Done</span>
              </div>
            )}
          </div>
          {exercise.specialInstructions && (
            <p className="text-sm text-[#9CA3AF] font-outfit font-normal leading-relaxed">{exercise.specialInstructions}</p>
          )}
        </div>
      </div>

      {/* Target Info */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#3D4058]">
        <div className="flex items-center gap-2 bg-[#1A1D2E] px-3 py-2 rounded-xl">
          <Target className="w-4 h-4 text-[#5B7FFF]" />
          <span className="text-sm font-outfit font-semibold text-white">{exercise.targetSets} סטים</span>
        </div>
        <div className="flex items-center gap-2 bg-[#1A1D2E] px-3 py-2 rounded-xl">
          <Dumbbell className="w-4 h-4 text-[#5B7FFF]" />
          <span className="text-sm font-outfit font-semibold text-white">{exercise.targetReps} reps</span>
        </div>
      </div>

      {/* Previous Record */}
      {exercise.previousBest && (
        <div className="bg-[#5B7FFF]/10 border border-[#5B7FFF]/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-[#5B7FFF] font-outfit font-semibold mb-1.5 uppercase tracking-wide">שיא קודם</p>
              <p className="text-xl font-outfit font-bold text-white">
                {exercise.previousBest.weight} <span className="text-sm text-[#9CA3AF]">kg</span> × {exercise.previousBest.reps} <span className="text-sm text-[#9CA3AF]">reps</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {beatPrevious && (
                <div className="bg-[#FF8A00] text-white px-2.5 py-1 rounded-lg text-xs font-outfit font-semibold flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  New Record!
                </div>
              )}
              <button
                onClick={onCopyPreviousWorkout}
                className="flex items-center gap-1.5 text-[#5B7FFF] hover:text-[#6B8EFF] text-xs font-outfit font-semibold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                העתק
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="mb-4">
        <label className="text-sm font-outfit font-semibold text-white mb-3 block">רישום הסט שלך</label>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-outfit font-medium text-[#9CA3AF] mb-2 text-center">משקל</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={data.weight}
                onChange={(e) => onUpdate("weight", e.target.value)}
                className="w-full h-14 bg-[#1A1D2E] border-2 border-transparent rounded-xl px-3 text-center text-xl font-outfit font-bold text-white focus:border-[#5B7FFF] focus:ring-2 focus:ring-[#5B7FFF]/20 transition-all outline-none"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] font-outfit font-medium">kg</span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-outfit font-medium text-[#9CA3AF] mb-2 text-center">חזרות</label>
            <input
              type="number"
              inputMode="numeric"
              value={data.reps}
              onChange={(e) => onUpdate("reps", e.target.value)}
              className="w-full h-14 bg-[#1A1D2E] border-2 border-transparent rounded-xl px-3 text-center text-xl font-outfit font-bold text-white focus:border-[#5B7FFF] focus:ring-2 focus:ring-[#5B7FFF]/20 transition-all outline-none"
              placeholder="0"
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-outfit font-medium text-[#9CA3AF] mb-2 text-center">RIR</label>
            <input
              type="number"
              inputMode="numeric"
              value={data.rir}
              onChange={(e) => onUpdate("rir", e.target.value)}
              className="w-full h-14 bg-[#1A1D2E] border-2 border-transparent rounded-xl px-3 text-center text-xl font-outfit font-bold text-white focus:border-[#5B7FFF] focus:ring-2 focus:ring-[#5B7FFF]/20 transition-all outline-none"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {hasData && (
          <button
            onClick={onClearExercise}
            className="flex-1 h-12 bg-[#1A1D2E] border border-[#3D4058] rounded-xl text-[#9CA3AF] hover:bg-[#3D4058] hover:text-white hover:border-[#4A4E69] text-sm font-outfit font-semibold transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            נקה
          </button>
        )}
        
        <Button
          onClick={() => onUpdate("isComplete", !data.isComplete)}
          className={cn(
            hasData ? "flex-1" : "w-full",
            "h-12 rounded-xl font-outfit font-semibold transition-all text-base",
            data.isComplete
              ? "bg-[#4CAF50] hover:bg-[#45A049] text-white"
              : "bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white"
          )}
        >
          {data.isComplete ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            "סיים תרגיל"
          )}
        </Button>
      </div>
    </div>
  );
});

ExerciseCard.displayName = 'ExerciseCard';

// --- Main Page Component ---

function WorkoutPageContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const routineIdFromUrl = searchParams.get('routine');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithExercises | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Exercise Data State
  const [exercisesData, setExercisesData] = useState<Record<string, ExerciseData>>({});
  
  const completedExercisesRef = useRef<Set<string>>(new Set());
  
  // UI State
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [startTime] = useState(new Date().toISOString());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer
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
  }, [user?.id, routineIdFromUrl]);

  useEffect(() => {
    if (selectedRoutine?.id && exercisesData && Object.keys(exercisesData).length > 0) {
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
      
      let routineToShow: RoutineWithExercises | undefined;
      
      if (routineIdFromUrl) {
        routineToShow = routinesWithExercises.find(r => r.id === routineIdFromUrl);
      }
      
      if (!routineToShow) {
        const lastLog = logs.find(log => log.date === new Date().toISOString().split('T')[0]);
        
        if (lastLog) {
          const lastRoutineIndex = routinesWithExercises.findIndex(r => r.id === lastLog.routine_id);
          const nextIndex = lastRoutineIndex >= 0 && lastRoutineIndex < routinesWithExercises.length - 1
            ? lastRoutineIndex + 1
            : 0;
          routineToShow = routinesWithExercises[nextIndex];
        } else {
          routineToShow = routinesWithExercises[0];
        }
      }

      if (routineToShow) {
        setSelectedRoutine(routineToShow);
        await loadExercisesWithHistory(routineToShow, user.id, logs);
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesWithHistory = async (routine: RoutineWithExercises, traineeId: string, existingLogs?: any[]) => {
    try {
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
          name: re.exercise?.name || 'Unknown Exercise',
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
        const parsed = JSON.parse(saved);
        const migrated: Record<string, ExerciseData> = {};
        Object.entries(parsed).forEach(([exerciseId, data]: [string, any]) => {
          if (data.weight !== undefined || data.reps !== undefined) {
            migrated[exerciseId] = {
              weight: data.weight || "",
              reps: data.reps || "",
              rir: data.rir || "1",
              isComplete: data.isComplete || false
            };
          } else if (data.sets && Array.isArray(data.sets) && data.sets.length > 0) {
            const sets = data.sets.filter((s: any) => s.weight && s.reps);
            if (sets.length > 0) {
              const heaviest = sets.reduce((max: any, set: any) => {
                const maxWeight = parseFloat(max.weight) || 0;
                const setWeight = parseFloat(set.weight) || 0;
                if (setWeight > maxWeight) return set;
                if (setWeight === maxWeight) {
                  const maxReps = parseInt(max.reps) || 0;
                  const setReps = parseInt(set.reps) || 0;
                  return setReps > maxReps ? set : max;
                }
                return max;
              }, sets[0]);
              
              migrated[exerciseId] = {
                weight: heaviest.weight || "",
                reps: heaviest.reps || "",
                rir: heaviest.rir || "1",
                isComplete: data.isComplete || false
              };
            } else {
              migrated[exerciseId] = {
                weight: "",
                reps: "",
                rir: "1",
                isComplete: data.isComplete || false
              };
            }
          } else {
            migrated[exerciseId] = {
              weight: "",
              reps: "",
              rir: "1",
              isComplete: false
            };
          }
        });
        setExercisesData(migrated);
        return;
      } catch (e) {
        console.error("Failed to restore backup", e);
      }
    }

    const initialData: Record<string, ExerciseData> = {};
    exercisesList.forEach((exercise) => {
      initialData[exercise.id] = {
        weight: "",
        reps: "",
        rir: "1",
        isComplete: false
      };
    });
    setExercisesData(initialData);
  };

  const updateExerciseData = useCallback((exerciseId: string, field: keyof ExerciseData, value: any) => {
    setExercisesData(prev => {
      const wasComplete = prev[exerciseId]?.isComplete;
      const newData = {
        ...prev,
        [exerciseId]: { ...prev[exerciseId], [field]: value }
      };
      
      if (field === 'isComplete' && value === true && !wasComplete && !completedExercisesRef.current.has(exerciseId)) {
        completedExercisesRef.current.add(exerciseId);
        setTimeout(() => {
          showToast('🎉 Exercise Complete!', "success", 2000);
        }, 0);
      }
      
      if (field === 'isComplete' && value === false) {
        completedExercisesRef.current.delete(exerciseId);
      }
      
      return newData;
    });
  }, [showToast]);

  const copyPreviousWorkoutSet = useCallback((exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise || !exercise.previousBest) {
      showToast('⚠️ No previous workout data', "warning", 2000);
      return;
    }

    setExercisesData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        weight: exercise.previousBest!.weight.toString(),
        reps: exercise.previousBest!.reps.toString(),
        rir: prev[exerciseId]?.rir || "1"
      }
    }));
    showToast('✅ Previous workout copied', "success", 1500);
  }, [exercises, showToast]);

  const clearExercise = useCallback((exerciseId: string) => {
    setExercisesData(prev => ({
      ...prev,
      [exerciseId]: {
        weight: "",
        reps: "",
        rir: "1",
        isComplete: false
      }
    }));
    showToast('🗑️ Exercise cleared', "info", 1500);
  }, [showToast]);

  const handleRoutineChange = async (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine);
    setShowRoutineSelector(false);
    setExercisesData({});
    await loadExercisesWithHistory(routine, user?.id || '');
  };

  const handleFinishWorkout = async () => {
    if (!selectedRoutine || !user?.id || exercises.length === 0) return;
    
    const hasValidData = Object.values(exercisesData).some(d => 
      d.weight && d.reps
    );

    if (!hasValidData) {
      showToast('⚠️ Cannot finish empty workout. Please complete at least one exercise.', "warning", 4000);
      return;
    }

    const incomplete = exercises.length - Object.values(exercisesData).filter(d => d.isComplete).length;
    if (incomplete > 0 && progress < 100) {
      setIncompleteCount(incomplete);
      setShowFinishConfirm(true);
      return;
    }

    finishWorkout();
  };

  const finishWorkout = async () => {
    if (!selectedRoutine || !user?.id || exercises.length === 0) return;
    
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
        if (!data || !data.weight || !data.reps) continue;

        const weight = parseFloat(data.weight) || 0;
        const reps = parseInt(data.reps) || 0;
        
        if (weight > 0 && reps > 0) {
          await createSetLog({
            log_id: workoutLog.id,
            exercise_id: exercise.exerciseId,
            set_number: 1,
            weight_kg: weight,
            reps: reps,
            rir_actual: parseInt(data.rir) || 2,
            notes: "Top Set",
          });
        }
      }

      localStorage.removeItem(`workout_backup_${selectedRoutine.id}`);
      
      const summaryData = {
        exercises: exercises.map(exercise => {
          const data = exercisesData[exercise.id];
          const sets = [];
          if (data && data.weight && data.reps) {
            sets.push({
              setNumber: 1,
              weight: data.weight,
              reps: data.reps,
              rir: data.rir
            });
          }
          return {
            ...exercise,
            sets,
            muscleGroup: 'General',
            exerciseId: exercise.exerciseId,
            previousPerformance: exercise.previousBest ? [exercise.previousBest] : []
          };
        }),
        routine: selectedRoutine,
        startTime: startTime
      };
      
      sessionStorage.setItem('workoutSummaryData', JSON.stringify(summaryData));
      
      showToast('✅ Workout saved successfully!', "success", 2000);
      
      setTimeout(() => {
        window.location.href = '/trainee/workout/summary';
      }, 1000);
      
    } catch (error: any) {
      console.error('Error finishing workout:', error);
      showToast(`❌ Error saving workout: ${error.message}`, "error", 5000);
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
      <LoadingSpinner 
        fullScreen 
        text="טוען אימון..." 
        size="lg"
        className="bg-[#1A1D2E]"
      />
    );
  }

  if (!workoutPlan || routines.length === 0 || !selectedRoutine || exercises.length === 0) {
    return (
      <div className="relative bg-[#1A1D2E] w-full min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Dumbbell className="h-16 w-16 text-[#5B7FFF] mb-4" />
        <h1 className="text-2xl font-outfit font-bold mb-3 text-white">אין אימון זמין</h1>
        <p className="text-[#9CA3AF] max-w-sm mb-6 font-outfit font-normal">
          {!workoutPlan && "המאמן שלך עדיין לא יצר תוכנית אימונים פעילה."}
          {workoutPlan && routines.length === 0 && "תוכנית האימונים לא מכילה שגרות."}
          {workoutPlan && routines.length > 0 && !selectedRoutine && "לא נמצאה שגרה מתאימה."}
          {workoutPlan && routines.length > 0 && selectedRoutine && exercises.length === 0 && "השגרה לא מכילה תרגילים."}
        </p>
        <Link href="/trainee/dashboard">
          <Button className="gap-2 bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white rounded-xl h-12 px-6">
            חזרה לדשבורד
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative bg-[#1A1D2E] w-full min-h-screen">
      {/* Main Content */}
      <div className="w-full overflow-y-auto pb-24">
        <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
          <div className="flex flex-col items-start w-full gap-6">
            
            {/* Header */}
            <div className="w-full flex items-center justify-between">
              <Link href="/trainee/workouts" className="w-10 h-10 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-2xl font-outfit font-bold text-white">
                {selectedRoutine ? (selectedRoutine.name || `אימון ${selectedRoutine.letter}`) : 'אימון'}
              </h1>
              <div className="w-10 h-10"></div>
            </div>

            {/* Workout Stats Card */}
            <div className="w-full bg-[#2D3142] rounded-2xl p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Exercises Stat */}
                <div className="bg-[#1A1D2E] rounded-xl p-3 flex flex-col items-center gap-2">
                  <div className="bg-[#FF8A00] p-2 rounded-lg">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-outfit font-bold text-white">
                      {Object.values(exercisesData).filter(d => d.isComplete).length}/{exercises.length}
                    </div>
                    <div className="text-xs font-outfit font-normal text-[#9CA3AF]">תרגילים</div>
                  </div>
                </div>

                {/* Time Stat */}
                <div className="bg-[#1A1D2E] rounded-xl p-3 flex flex-col items-center gap-2">
                  <div className="bg-[#5B7FFF] p-2 rounded-lg">
                    <Timer className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-outfit font-bold text-white">
                      {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs font-outfit font-normal text-[#9CA3AF]">זמן</div>
                  </div>
                </div>

                {/* Progress Stat */}
                <div className="bg-[#1A1D2E] rounded-xl p-3 flex flex-col items-center gap-2">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="#3D4058" strokeWidth="3" fill="none" />
                      <circle
                        cx="24" cy="24" r="20" stroke="#5B7FFF" strokeWidth="3" fill="none"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                        className="transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-outfit font-bold text-white">{progress}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-outfit font-normal text-[#9CA3AF]">התקדמות</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exercises */}
            <div className="w-full flex flex-col gap-5">
              {exercises.map((exercise, index) => {
                const data = exercisesData[exercise.id] || { 
                  weight: "",
                  reps: "",
                  rir: "1",
                  isComplete: false
                };
                
                return (
                  <div key={exercise.id}>
                    <ExerciseCard
                      exercise={exercise}
                      data={data}
                      onUpdate={(field, value) => updateExerciseData(exercise.id, field, value)}
                      onCopyPreviousWorkout={() => copyPreviousWorkoutSet(exercise.id)}
                      onClearExercise={() => clearExercise(exercise.id)}
                    />
                  </div>
                );
              })}
        
              {/* Success Message */}
              {exercises.length > 0 && Object.values(exercisesData).every(d => d.isComplete) && (
                <div className="bg-[#4CAF50] rounded-2xl p-6 text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-2xl font-outfit font-bold text-white mb-2">עבודה מעולה!</h3>
                  <p className="text-base text-white/90">סיימת את כל התרגילים!</p>
                </div>
              )}

              {/* Finish Button */}
              <Button
                onClick={handleFinishWorkout}
                disabled={saving}
                className={cn(
                  "w-full h-14 rounded-xl font-outfit font-bold text-lg transition-all",
                  progress === 100 
                    ? "bg-[#4CAF50] hover:bg-[#45A049] text-white" 
                    : "bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white",
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
                    <span>{progress === 100 ? "סיים אימון 🎉" : "סיים אימון"}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Finish Confirmation Dialog */}
      <Dialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
        <DialogContent className="sm:max-w-md bg-[#2D3142] border-[#3D4058]">
          <DialogHeader>
            <DialogTitle className="text-white font-outfit font-bold text-xl">אישור סיום אימון</DialogTitle>
            <DialogDescription className="text-[#9CA3AF] font-outfit font-normal text-base">
              יש לך {incompleteCount} תרגילים שלא סומנו כמושלמים. האם אתה בטוח שברצונך לסיים את האימון?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFinishConfirm(false)}
              className="w-full sm:w-auto border-[#3D4058] text-white hover:bg-[#3D4058] bg-[#1A1D2E] h-11 rounded-xl"
            >
              ביטול
            </Button>
            <Button
              onClick={finishWorkout}
              disabled={saving}
              className="w-full sm:w-auto bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white h-11 rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  שומר...
                </>
              ) : (
                "סיים אימון"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WorkoutPage() {
  return <WorkoutPageContent />;
}