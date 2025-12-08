import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getActiveWorkoutPlan,
  getRoutinesWithExercises,
  getWorkoutLogs,
  createWorkoutLog,
  createSetLog,
} from '@/lib/api/workouts';
import type { RoutineWithExercises, WorkoutLogWithDetails } from '@/lib/types';

// Types
export interface ExerciseData {
  heaviestWeight: string;
  heaviestReps: string;
  heaviestRir: string;
  totalSetsDone: number;
  isComplete: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  specialInstructions: string;
  targetSets: number;
  targetReps: string;
  restTime: number;
  exerciseId: string;
  previousBest?: { weight: number; reps: number };
}

interface UseWorkoutSessionOptions {
  userId: string;
  onError?: (error: Error) => void;
}

export function useWorkoutSession({ userId, onError }: UseWorkoutSessionOptions) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithExercises | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesData, setExercisesData] = useState<Record<string, ExerciseData>>({});
  
  // UI State
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

  // Load workout data
  const loadWorkoutData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      
      const [plan, logs] = await Promise.all([
        getActiveWorkoutPlan(userId),
        getWorkoutLogs(userId, 10)
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
      await loadExercisesWithHistory(routineToShow, userId, logs);
    } catch (error) {
      console.error('Error loading workout data:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, onError]);

  // Load exercises with history
  const loadExercisesWithHistory = useCallback(async (
    routine: RoutineWithExercises,
    traineeId: string,
    existingLogs?: WorkoutLogWithDetails[]
  ) => {
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
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [onError]);

  // Initialize exercises data
  const initializeExercisesData = useCallback((exercisesList: Exercise[], routineId: string) => {
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
  }, []);

  // Update exercise data
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

  // Handle routine change
  const handleRoutineChange = useCallback(async (routine: RoutineWithExercises) => {
    setSelectedRoutine(routine);
    setExercisesData({});
    await loadExercisesWithHistory(routine, userId);
  }, [userId, loadExercisesWithHistory]);

  // Finish workout
  const finishWorkout = useCallback(async () => {
    if (!selectedRoutine || !userId || exercises.length === 0) return;
    
    const hasValidData = Object.values(exercisesData).some(d => 
      d.totalSetsDone > 0 || (d.heaviestWeight && d.heaviestReps)
    );

    if (!hasValidData) {
      throw new Error('לא ניתן לסיים אימון ריק. אנא מלא לפחות תרגיל אחד.');
    }

    try {
      setSaving(true);
      const workoutLog = await createWorkoutLog({
        user_id: userId,
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
      
      return summaryData;
    } catch (error: any) {
      console.error('Error finishing workout:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [selectedRoutine, userId, exercises, exercisesData, startTime]);

  // Save to localStorage on data change
  useEffect(() => {
    if (selectedRoutine?.id && exercisesData && Object.keys(exercisesData).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`workout_backup_${selectedRoutine.id}`, JSON.stringify(exercisesData));
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [exercisesData, selectedRoutine]);

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadWorkoutData();
    }
  }, [userId, loadWorkoutData]);

  // Calculate progress
  const progress = useMemo(() => {
    if (exercises.length === 0) return 0;
    const completed = Object.values(exercisesData).filter(d => d.isComplete).length;
    return Math.round((completed / exercises.length) * 100);
  }, [exercises, exercisesData]);

  return {
    // State
    loading,
    saving,
    workoutPlan,
    routines,
    selectedRoutine,
    exercises,
    exercisesData,
    elapsedTime,
    progress,
    startTime,
    
    // Actions
    updateExerciseData,
    handleRoutineChange,
    finishWorkout,
    reload: loadWorkoutData,
  };
}



