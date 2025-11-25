"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getUser,
  getActiveWorkoutPlan,
  createWorkoutPlan,
  getRoutinesWithExercises,
  createRoutine,
  getExerciseLibrary,
  createRoutineExercise,
  updateRoutineExercise,
  deleteRoutineExercise,
  updateWorkoutPlan,
  createExercise,
  getExerciseByName,
  updateExercise,
} from "@/lib/db";
import type { User, RoutineWithExercises, Exercise, RoutineLetter } from "@/lib/types";
import { WorkoutRoutineCard } from "@/components/trainer/workout-editor/WorkoutRoutineCard";
import { ExerciseLibrarySidebar } from "@/components/trainer/workout-editor/ExerciseLibrarySidebar";

function WorkoutPlanEditorContent() {
  const params = useParams();
  const traineeId = params.traineeId as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainee, setTrainee] = useState<User | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({});
  const [selectedRoutineForExercise, setSelectedRoutineForExercise] = useState<string | null>(null);
  
  // Mobile responsive states
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Load data
  useEffect(() => {
    if (traineeId && user?.id) {
      loadData();
    }
  }, [traineeId, user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const traineeData = await getUser(traineeId);
      setTrainee(traineeData);

      let plan = await getActiveWorkoutPlan(traineeId);
      
      if (!plan) {
        // Create a new plan if none exists
        plan = await createWorkoutPlan({
          trainee_id: traineeId,
          trainer_id: user!.id,
          name: `תוכנית אימונים - ${traineeData?.name || 'מתאמן'}`,
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          weekly_target_workouts: 5,
        });
      }

      setWorkoutPlan(plan);

      const routinesData = await getRoutinesWithExercises(plan.id);
      setRoutines(routinesData);
      
      // Expand first routine by default
      if (routinesData.length > 0) {
        setExpandedRoutines({ [routinesData[0].id]: true });
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
    setExpandedRoutines(prev => ({
      ...prev,
      [routineId]: !prev[routineId]
    }));
  };

  const handleAddRoutine = async () => {
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

      // Refresh to get full data
      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
      setExpandedRoutines(prev => ({ ...prev, [newRoutine.id]: true }));
    } catch (error: any) {
      alert("שגיאה ביצירת רוטינה: " + error.message);
    }
  };

  const handleAddExercise = async (routineId: string, exercise: Exercise) => {
    if (!workoutPlan) return;

    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    // Optimistic UI: Update state immediately
    const tempExerciseId = `temp-${Date.now()}`;
    const newRoutineExercise = {
      id: tempExerciseId,
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

    setRoutines(prev => prev.map(r => 
      r.id === routineId 
        ? { ...r, routine_exercises: [...r.routine_exercises, newRoutineExercise as any] }
        : r
    ));

    try {
      const created = await createRoutineExercise({
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

      // Replace temp with real data
      const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
      setRoutines(updatedRoutines);
      setShowRightSidebar(false);
      setSelectedRoutineForExercise(null);
    } catch (error: any) {
      // Rollback on error
      setRoutines(prev => prev.map(r => 
        r.id === routineId 
          ? { ...r, routine_exercises: r.routine_exercises.filter(re => re.id !== tempExerciseId) }
          : r
      ));
      alert("שגיאה בהוספת תרגיל: " + error.message);
    }
  };

  const handleCreateAndAddExercise = async (
    routineId: string,
    exerciseData: { name: string; muscle_group: string; image_url: string }
  ) => {
    if (!workoutPlan) {
      alert("שגיאה: תוכנית אימון לא נמצאה");
      return;
    }

    try {
      // Check if exercise already exists
      let exercise = await getExerciseByName(exerciseData.name.trim());
      
      if (!exercise) {
        // Create new exercise
        exercise = await createExercise({
          name: exerciseData.name.trim(),
          muscle_group: exerciseData.muscle_group,
          image_url: exerciseData.image_url.trim() || null,
          video_url: null,
          description: null,
          created_by: user?.id || null,
        });

        // Update exercise library optimistically
        setExerciseLibrary(prev => [...prev, exercise!]);
      }

      // Add exercise to routine (this will handle optimistic UI)
      await handleAddExercise(routineId, exercise);
    } catch (error: any) {
      alert("שגיאה ביצירת תרגיל: " + error.message);
      throw error;
    }
  };

  const handleUpdateExercise = async (exerciseId: string, updates: any) => {
    // Optimistic UI: Update state immediately
    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.map(re =>
        re.id === exerciseId ? { ...re, ...updates } : re
      )
    })));

    try {
      await updateRoutineExercise(exerciseId, updates);
      // Optionally refresh to get server state, but UI already updated
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
      }
    } catch (error: any) {
      // Rollback on error
      setRoutines(previousRoutines);
      alert("שגיאה בעדכון תרגיל: " + error.message);
      throw error;
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    // Optimistic UI: Remove from state immediately
    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.filter(re => re.id !== exerciseId)
    })));

    try {
      await deleteRoutineExercise(exerciseId);
      // Optionally refresh to get server state, but UI already updated
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
      }
    } catch (error: any) {
      // Rollback on error
      setRoutines(previousRoutines);
      alert("שגיאה במחיקת תרגיל: " + error.message);
      throw error;
    }
  };

  const handleSavePlan = async () => {
    if (!workoutPlan) return;

    try {
      setSaving(true);
      await updateWorkoutPlan(workoutPlan.id, {
        name: workoutPlan.name,
      });
      alert("התוכנית נשמרה בהצלחה!");
    } catch (error: any) {
      alert("שגיאה בשמירת התוכנית: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExerciseImage = async (exerciseId: string, imageUrl: string) => {
    // Find the exercise from routine_exercises
    const routineExercise = routines
      .flatMap(r => r.routine_exercises)
      .find(re => re.id === exerciseId);
    
    if (!routineExercise?.exercise?.id) {
      alert("תרגיל לא נמצא");
      return;
    }

    // Optimistic UI: Update image immediately
    const previousRoutines = [...routines];
    setRoutines(prev => prev.map(routine => ({
      ...routine,
      routine_exercises: routine.routine_exercises.map(re =>
        re.id === exerciseId && re.exercise
          ? { ...re, exercise: { ...re.exercise, image_url: imageUrl.trim() || null } }
          : re
      )
    })));

    // Update exercise library too
    setExerciseLibrary(prev => prev.map(ex =>
      ex.id === routineExercise.exercise!.id
        ? { ...ex, image_url: imageUrl.trim() || null }
        : ex
    ));

    try {
      await updateExercise(routineExercise.exercise.id, {
        image_url: imageUrl.trim() || null,
      });
      
      // Refresh to ensure consistency
      if (workoutPlan) {
        const updatedRoutines = await getRoutinesWithExercises(workoutPlan.id);
        setRoutines(updatedRoutines);
        const exercises = await getExerciseLibrary();
        setExerciseLibrary(exercises);
      }
    } catch (error: any) {
      // Rollback on error
      setRoutines(previousRoutines);
      alert("שגיאה בעדכון תמונה: " + error.message);
    }
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
            <p className="text-xl font-black text-foreground animate-pulse">טוען תוכנית אימון...</p>
            <p className="text-sm text-muted-foreground mt-1">מכין את עורך התוכניות</p>
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
    <div className="flex flex-col lg:flex-row h-full bg-background" dir="rtl">
      {/* Center Editor */}
      <main className="flex-1 overflow-y-auto">
        {/* Enhanced Top Bar */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-card to-card/95 backdrop-blur-lg border-b-2 border-border px-5 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Link href={`/trainer/trainee/${traineeId}`}>
              <div className="bg-background p-2.5 rounded-2xl shadow-md border border-border hover:bg-accent/50 transition-all active:scale-95">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <div>
              <p className="text-primary font-bold text-xs uppercase tracking-wider">FitLog Editor 📋</p>
              <h1 className="text-2xl font-black text-foreground">עורך תוכניות אימון</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSavePlan}
              disabled={saving}
              className="h-11 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 ml-2" />
                  שמור תוכנית
                </>
              )}
            </Button>
          </div>
        </div>

          {/* Enhanced Plan Structure */}
          <div className="p-5 lg:p-6 space-y-6">
            {/* Plan Name Section */}
            <div className="bg-gradient-to-br from-card via-card to-accent/10 rounded-[2rem] p-6 shadow-lg border-2 border-border">
              <label className="text-sm text-muted-foreground mb-3 block font-bold uppercase tracking-wider">שם התוכנית:</label>
              <Input
                value={workoutPlan?.name || ""}
                onChange={(e) => setWorkoutPlan({ ...workoutPlan, name: e.target.value })}
                className="bg-accent/30 border-2 border-border text-foreground rounded-xl h-12 font-bold text-lg focus:border-primary transition-all"
                placeholder="שם התוכנית"
              />
            </div>

            {/* Routines Section */}
            <div className="space-y-4">
              {routines.length > 0 && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/20 p-2 rounded-xl">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-black text-foreground">רוטינות אימון</h2>
                  <div className="bg-primary/10 px-3 py-1 rounded-lg border border-primary/30">
                    <span className="text-primary font-black text-sm">{routines.length}</span>
                  </div>
                </div>
              )}
              
              {routines.map((routine, index) => (
                <div 
                  key={routine.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <WorkoutRoutineCard
                    routine={routine}
                    isExpanded={!!expandedRoutines[routine.id]}
                    onToggle={() => toggleRoutine(routine.id)}
                    onAddExercise={() => {
                      setSelectedRoutineForExercise(routine.id);
                      setShowRightSidebar(true);
                      // Scroll to top of sidebar on mobile
                      if (window.innerWidth < 1024) {
                        setTimeout(() => {
                          const sidebar = document.querySelector('aside');
                          if (sidebar) {
                            sidebar.scrollTop = 0;
                          }
                        }, 100);
                      }
                    }}
                    onUpdateExercise={handleUpdateExercise}
                    onDeleteExercise={handleDeleteExercise}
                    onUpdateExerciseImage={handleUpdateExerciseImage}
                  />
                </div>
              ))}
              
              <Button
                onClick={handleAddRoutine}
                className="w-full h-14 bg-gradient-to-r from-accent/50 to-accent/30 border-2 border-dashed border-border hover:border-primary/50 text-foreground hover:bg-accent/60 font-black rounded-2xl transition-all active:scale-98"
              >
                <Plus className="h-5 w-5 ml-2" />
                הוסף רוטינה חדשה
              </Button>
            </div>
          </div>
        </main>

      {/* Right Sidebar - Exercise Library */}
      <ExerciseLibrarySidebar
        exercises={exerciseLibrary}
        routines={routines}
        selectedRoutineId={selectedRoutineForExercise}
        onSelectExercise={async (routineId, exercise) => {
          await handleAddExercise(routineId, exercise);
          setShowRightSidebar(false);
          setSelectedRoutineForExercise(null);
        }}
        onCreateAndAdd={handleCreateAndAddExercise}
        onClose={() => setShowRightSidebar(false)}
        onClearSelection={() => setSelectedRoutineForExercise(null)}
        isOpen={showRightSidebar}
      />
    </div>
  );
}

export default function WorkoutPlanEditorPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <WorkoutPlanEditorContent />
    </ProtectedRoute>
  );
}

