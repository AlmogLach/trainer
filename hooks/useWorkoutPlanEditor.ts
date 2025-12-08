import { useState, useEffect } from "react";
import { 
  getUser, 
  getActiveWorkoutPlan, 
  createWorkoutPlan, 
  getRoutinesWithExercises, 
  createRoutine, 
  deleteRoutine,
  getExerciseLibrary, 
  createRoutineExercise, 
  updateRoutineExercise, 
  deleteRoutineExercise, 
  updateWorkoutPlan, 
  createExercise, 
  getExerciseByName, 
  updateExercise 
} from "@/lib/db";
import type { User, RoutineWithExercises, Exercise, RoutineLetter } from "@/lib/types";

export function useWorkoutPlanEditor(traineeId: string, trainerId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainee, setTrainee] = useState<User | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  
  // UI State
  const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (traineeId && trainerId) {
      loadData();
    }
  }, [traineeId, trainerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const traineeData = await getUser(traineeId);
      setTrainee(traineeData);

      let plan = await getActiveWorkoutPlan(traineeId);
      
      if (!plan && trainerId) {
        plan = await createWorkoutPlan({
          trainee_id: traineeId,
          trainer_id: trainerId,
          name: `תוכנית אימונים - ${traineeData?.name || 'מתאמן'}`,
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          weekly_target_workouts: 5,
        });
      }

      setWorkoutPlan(plan);

      if (plan) {
        const routinesData = await getRoutinesWithExercises(plan.id);
        setRoutines(routinesData);
        if (routinesData.length > 0) {
          setExpandedRoutines({ [routinesData[0].id]: true });
        }
      }

      const exercises = await getExerciseLibrary();
      setExerciseLibrary(exercises);
    } catch (error: any) {
      console.error("Error loading data:", error);
      alert("שגיאה בטעינת הנתונים: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRoutine = (routineId: string) => {
    setExpandedRoutines(prev => ({ ...prev, [routineId]: !prev[routineId] }));
  };

  const addRoutine = async () => {
    if (!workoutPlan) return;
    const existingLetters = routines.map(r => r.letter);
    const availableLetters: RoutineLetter[] = ['A', 'B', 'C', 'D', 'E'];
    const nextLetter = availableLetters.find(l => !existingLetters.includes(l));

    if (!nextLetter) {
      alert("כל הרוטינות (A-E) כבר קיימות");
      return;
    }

    try {
      const newRoutine = await createRoutine({
        plan_id: workoutPlan.id,
        letter: nextLetter,
        name: `רוטינה ${nextLetter}`,
        description: null,
        order_index: routines.length,
      });

      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
      setExpandedRoutines(prev => ({ ...prev, [newRoutine.id]: true }));
    } catch (error: any) {
      alert("שגיאה ביצירת רוטינה: " + error.message);
    }
  };

  const removeRoutine = async (routineId: string) => {
    if (!workoutPlan) return;
    
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    // Check if routine has exercises
    if (routine.routine_exercises.length > 0) {
      const confirmed = confirm(`הרוטינה ${routine.letter} מכילה ${routine.routine_exercises.length} תרגילים. האם אתה בטוח שברצונך למחוק אותה? כל התרגילים יימחקו גם כן.`);
      if (!confirmed) return;
    }

    const prevRoutines = [...routines];
    setRoutines(prev => prev.filter(r => r.id !== routineId));
    setExpandedRoutines(prev => {
      const newExpanded = { ...prev };
      delete newExpanded[routineId];
      return newExpanded;
    });

    try {
      await deleteRoutine(routineId);
      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
    } catch (error: any) {
      setRoutines(prevRoutines);
      alert("שגיאה במחיקת רוטינה: " + error.message);
    }
  };

  const addExerciseToRoutine = async (routineId: string, exercise: Exercise) => {
    if (!workoutPlan) return;
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const newRE = {
      id: tempId,
      routine_id: routineId,
      exercise_id: exercise.id,
      order_index: routine.routine_exercises.length,
      target_sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
      rir_target: 2,
      rest_time_seconds: 90,
      notes: null,
      special_instructions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      exercise: exercise,
    };

    setRoutines(prev => prev.map(r => r.id === routineId ? { ...r, routine_exercises: [...r.routine_exercises, newRE as any] } : r));

    try {
      await createRoutineExercise({
        routine_id: routineId,
        exercise_id: exercise.id,
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rir_target: 2,
        rest_time_seconds: 90,
        notes: null,
        special_instructions: null,
        order_index: routine.routine_exercises.length,
      });
      
      // Refresh for real ID
      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
    } catch (error: any) {
        // Rollback
        setRoutines(prev => prev.map(r => r.id === routineId ? { ...r, routine_exercises: r.routine_exercises.filter(re => re.id !== tempId) } : r));
        alert("שגיאה בהוספת תרגיל: " + error.message);
    }
  };

  const createAndAddExercise = async (routineId: string, data: { name: string; muscle_group: string; image_url: string }) => {
      if (!workoutPlan) return;
      try {
        let exercise = await getExerciseByName(data.name.trim());
        if (!exercise) {
            exercise = await createExercise({
                name: data.name.trim(),
                muscle_group: data.muscle_group,
                image_url: data.image_url.trim() || null,
                video_url: null,
                description: null,
                created_by: trainerId || null,
            });
            setExerciseLibrary(prev => [...prev, exercise!]);
        }
        await addExerciseToRoutine(routineId, exercise);
      } catch (error: any) {
          alert("שגיאה: " + error.message);
      }
  };

  const updateExerciseInRoutine = async (exerciseId: string, updates: any) => {
      // Optimistic
      const prevRoutines = [...routines];
      setRoutines(prev => prev.map(r => ({
          ...r,
          routine_exercises: r.routine_exercises.map(re => re.id === exerciseId ? { ...re, ...updates } : re)
      })));

      try {
          await updateRoutineExercise(exerciseId, updates);
      } catch (error: any) {
          setRoutines(prevRoutines);
          alert("שגיאה בעדכון: " + error.message);
      }
  };

  const removeExerciseFromRoutine = async (exerciseId: string) => {
      const prevRoutines = [...routines];
      setRoutines(prev => prev.map(r => ({
          ...r,
          routine_exercises: r.routine_exercises.filter(re => re.id !== exerciseId)
      })));

      try {
          await deleteRoutineExercise(exerciseId);
      } catch (error: any) {
          setRoutines(prevRoutines);
          alert("שגיאה במחיקה: " + error.message);
      }
  };

  const savePlanName = async (name: string) => {
      if (!workoutPlan) return;
      setSaving(true);
      try {
          await updateWorkoutPlan(workoutPlan.id, { name });
          setWorkoutPlan({ ...workoutPlan, name });
          alert("נשמר בהצלחה");
      } catch (error: any) {
          alert("שגיאה בשמירה: " + error.message);
      } finally {
          setSaving(false);
      }
  };

  const updateExerciseImage = async (exerciseId: string, imageUrl: string) => {
      // לוגיקה דומה לקיים...
      // ...
  };

  return {
      loading,
      saving,
      trainee,
      workoutPlan,
      routines,
      exerciseLibrary,
      expandedRoutines,
      toggleRoutine,
      addRoutine,
      removeRoutine,
      addExerciseToRoutine,
      createAndAddExercise,
      updateExerciseInRoutine,
      removeExerciseFromRoutine,
      savePlanName,
      updateExerciseImage,
      setWorkoutPlan // לחשיפה אם רוצים לערוך את השם בזמן אמת ב-Input
  };
}