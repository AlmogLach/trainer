"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Trophy, Share2, Home, Target, Dumbbell, Loader2, Timer, ArrowUp, ArrowDown, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { RoutineWithExercises, Exercise } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface SetData {
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
}

interface ExerciseData extends Exercise {
  sets: SetData[];
  muscleGroup: string;
  exerciseId: string;
  previousPerformance?: { weight: number; reps: number }[];
}

function WorkoutSummaryContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workoutData, setWorkoutData] = useState<{
    exercises: ExerciseData[];
    routine: RoutineWithExercises | null;
    startTime: string;
  } | null>(null);
  const [summary, setSummary] = useState({
    duration: "00:00:00",
    totalWeight: 0,
    volume: "Low",
    volumePercent: 0,
    completedExercises: [] as Array<{ name: string; sets: number; weight: number; reps: number; previousWeight?: number; previousReps?: number; isRecord?: boolean }>,
    personalRecords: [] as Array<{ exercise: string; weight: number; previousWeight: number }>,
    exerciseCount: 0,
    recordsCount: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadWorkoutData();
    }
  }, [user?.id]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      const storedData = sessionStorage.getItem('workoutSummaryData');
      if (!storedData) {
        router.push('/trainee/workout');
        return;
      }

      const data = JSON.parse(storedData);
      setWorkoutData(data);

      calculateSummary(data);

    } catch (error) {
      console.error('Error loading workout data:', error);
      router.push('/trainee/workout');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: any) => {
    const { exercises, startTime } = data;
    
    // Calculate duration
    const start = new Date(startTime);
    const end = new Date();
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const exerciseStats: Record<string, { weight: number; sets: number; reps: number; previousWeight?: number; previousReps?: number; isRecord?: boolean }> = {};

    exercises.forEach((exercise: ExerciseData) => {
      let maxWeight = 0;
      let maxReps = 0;
      
      exercise.sets.forEach((set) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        if (weight > maxWeight) {
          maxWeight = weight;
          maxReps = reps;
        }
      });
      
      if (maxWeight > 0) {
        const previousWeight = exercise.previousPerformance?.[0]?.weight;
        const previousReps = exercise.previousPerformance?.[0]?.reps;
        const isRecord = previousWeight ? maxWeight > previousWeight || (maxWeight === previousWeight && maxReps > (previousReps || 0)) : false;
        
        exerciseStats[exercise.name] = {
          weight: maxWeight,
          sets: exercise.sets.filter(s => s.weight && s.reps).length,
          reps: maxReps,
          previousWeight,
          previousReps,
          isRecord,
        };
      }
    });

    const totalExercises = Object.keys(exerciseStats).length;
    let volume = "Low";
    let volumePercent = 33;
    if (totalExercises >= 6) {
      volume = "High";
      volumePercent = 100;
    } else if (totalExercises >= 4) {
      volume = "Medium";
      volumePercent = 66;
    }

    const completedExercises = Object.entries(exerciseStats).map(([name, stats]) => ({
      name,
      sets: stats.sets,
      weight: stats.weight,
      reps: stats.reps,
      previousWeight: stats.previousWeight,
      previousReps: stats.previousReps,
      isRecord: stats.isRecord || false,
    }));

    const personalRecords: Array<{ exercise: string; weight: number; previousWeight: number }> = [];
    exercises.forEach((exercise: ExerciseData) => {
      const maxWeight = Math.max(...exercise.sets.map(s => parseFloat(s.weight) || 0));
      if (maxWeight > 0 && exercise.previousPerformance?.[0]) {
        const previousMax = exercise.previousPerformance[0].weight;
        if (maxWeight > previousMax) {
          personalRecords.push({
            exercise: exercise.name,
            weight: maxWeight,
            previousWeight: previousMax,
          });
        }
      }
    });

    setSummary({
      duration,
      totalWeight: 0,
      volume,
      volumePercent,
      completedExercises,
      personalRecords,
      exerciseCount: completedExercises.length,
      recordsCount: personalRecords.length,
    });
  };

  const handleSaveWorkout = async () => {
    if (!workoutData || !user?.id) return;

    try {
      setSaving(true);
      sessionStorage.removeItem('workoutSummaryData');
      router.push('/trainee/dashboard');
    } catch (error: any) {
      console.error('Error navigating:', error);
      showToast('Error navigating to home: ' + (error.message || 'Unknown error'), "error", 5000);
    } finally {
      setSaving(false);
    }
  };

  const getSuccessMessage = () => {
    if (summary.recordsCount > 0) {
      return "עבודה מדהימה! שיאים חדשים! 🔥";
    }
    if (summary.exerciseCount >= 5) {
      return "Excellent Work! Keep it up! 💪";
    }
    return "Great Job! Perfect Workout! 🎉";
  };

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="טוען סיכום..." 
        size="lg"
        className="bg-[#1A1D2E]"
      />
    );
  }

  if (!workoutData) {
    return (
      <div className="min-h-screen bg-[#1A1D2E] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#9CA3AF] mb-4 font-outfit font-normal">אין נתוני אימון</p>
          <Link href="/trainee/workout">
            <Button className="bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white font-outfit font-semibold rounded-xl h-12 px-6">
              חזרה לאימון
            </Button>
          </Link>
        </div>
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
              <Link href="/trainee/dashboard" className="w-10 h-10 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <h1 className="text-2xl font-outfit font-bold text-white">
                סיכום אימון
              </h1>
              <div className="w-10 h-10 bg-[#2D3142] rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[#FF8A00]" />
              </div>
            </div>

            {/* Success Card */}
            <div className={cn(
              "w-full rounded-2xl p-6 text-center",
              summary.recordsCount > 0 ? "bg-gradient-to-br from-[#FF8A00] to-[#FF6B00]" : "bg-gradient-to-br from-[#4CAF50] to-[#45A049]"
            )}>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-outfit font-bold text-white mb-2">{getSuccessMessage()}</h2>
                  {summary.recordsCount > 0 && (
                    <p className="text-lg text-white/90 font-outfit font-semibold">
                      {summary.recordsCount} שיא{summary.recordsCount > 1 ? 'ים' : ''} חדש{summary.recordsCount > 1 ? 'ים' : ''}!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="w-full bg-[#2D3142] rounded-2xl p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Duration Stat */}
                <div className="bg-[#1A1D2E] rounded-xl p-3 flex flex-col items-center gap-2">
                  <div className="bg-[#5B7FFF] p-2 rounded-lg">
                    <Timer className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-outfit font-bold text-white">{summary.duration.split(':')[1]}:{summary.duration.split(':')[2]}</div>
                    <div className="text-xs font-outfit font-normal text-[#9CA3AF] mt-1">משך זמן</div>
                  </div>
                </div>

                {/* Exercise Count Stat */}
                <div className="bg-[#1A1D2E] rounded-xl p-3 flex flex-col items-center gap-2">
                  <div className="bg-[#FF8A00] p-2 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-outfit font-bold text-white">{summary.exerciseCount}</div>
                    <div className="text-xs font-outfit font-normal text-[#9CA3AF] mt-1">תרגילים</div>
                  </div>
                </div>

                {/* Records Count Stat */}
                <div className={cn(
                  "rounded-xl p-3 flex flex-col items-center gap-2",
                  summary.recordsCount > 0 ? "bg-[#FF8A00]" : "bg-[#1A1D2E]"
                )}>
                  <div className={cn(
                    "p-2 rounded-lg",
                    summary.recordsCount > 0 ? "bg-white/20" : "bg-[#2D3142]"
                  )}>
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-outfit font-bold text-white">{summary.recordsCount}</div>
                    <div className={cn(
                      "text-xs font-outfit font-normal mt-1",
                      summary.recordsCount > 0 ? "text-white/90" : "text-[#9CA3AF]"
                    )}>שיאים</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Exercises Card */}
            <div className="w-full bg-[#2D3142] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="bg-[#4CAF50] p-2 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-outfit font-bold text-white">תרגילים שהושלמו</h2>
              </div>
              <div className="flex flex-col gap-4">
                {summary.completedExercises.map((exercise, index) => {
                  const hasPrevious = exercise.previousWeight !== undefined;
                  const previousWeight = exercise.previousWeight || 0;
                  const isImprovement = hasPrevious && (exercise.isRecord || (exercise.weight > previousWeight) || (exercise.weight === previousWeight && exercise.reps > (exercise.previousReps || 0)));
                  const isNew = !hasPrevious;
                  
                  return (
                    <div 
                      key={index} 
                      className="bg-[#1A1D2E] rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-5 w-5 text-[#4CAF50] flex-shrink-0" />
                            <h3 className="text-lg font-outfit font-bold text-white">{exercise.name}</h3>
                          </div>
                          {exercise.isRecord && (
                            <div className="inline-flex items-center gap-1.5 bg-[#FF8A00] text-white px-3 py-1.5 rounded-lg text-xs font-outfit font-semibold mb-3">
                              <Trophy className="w-3.5 h-3.5" />
                              New Record!
                            </div>
                          )}
                          <div className="flex items-center gap-4 flex-wrap">
                            <div>
                              <p className="text-xs text-[#9CA3AF] font-outfit font-medium mb-1.5">Weight × Reps</p>
                              <p className="text-xl font-outfit font-bold text-white">
                                {exercise.weight} <span className="text-sm text-[#9CA3AF]">kg</span> × {exercise.reps}
                              </p>
                            </div>
                            {hasPrevious && (
                              <div className="flex flex-col gap-1.5">
                                {isImprovement ? (
                                  <div className="flex items-center gap-1.5 text-[#4CAF50]">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm font-outfit font-semibold">Improved!</span>
                                  </div>
                                ) : exercise.weight < previousWeight ? (
                                  <div className="flex items-center gap-1.5 text-[#EF4444]">
                                    <ArrowDown className="w-4 h-4" />
                                    <span className="text-sm font-outfit font-semibold">Decreased</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                                    <span className="text-sm font-outfit font-semibold">Same</span>
                                  </div>
                                )}
                                <span className="text-xs text-[#9CA3AF] font-outfit font-normal">
                                  Previous: {exercise.previousWeight || 0} kg × {exercise.previousReps || 0}
                                </span>
                              </div>
                            )}
                            {isNew && (
                              <span className="bg-[#5B7FFF]/20 text-[#5B7FFF] px-3 py-1.5 rounded-lg text-xs font-outfit font-semibold">
                                פעם ראשונה
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Personal Records Card */}
            {summary.personalRecords.length > 0 && (
              <div className="w-full bg-gradient-to-br from-[#FF8A00] to-[#FF6B00] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-outfit font-bold text-white">שיאים אישיים חדשים! 🔥</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {summary.personalRecords.map((record, index) => (
                    <div 
                      key={index} 
                      className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 text-white flex-shrink-0" />
                          <div>
                            <p className="text-white font-outfit font-bold text-base">{record.exercise}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-white font-outfit font-bold text-xl">{record.weight} kg</span>
                              <span className="text-white/70 text-sm line-through font-outfit font-normal">{record.previousWeight} kg</span>
                            </div>
                          </div>
                        </div>
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col w-full gap-4">
              <Button
                className="w-full bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white font-outfit font-bold h-14 rounded-xl transition-all text-lg"
                onClick={handleSaveWorkout}
                disabled={saving}
              >
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  <span>{saving ? "מעביר..." : "חזרה לבית"}</span>
                </div>
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="w-full bg-[#2D3142] hover:bg-[#3D4058] text-white font-outfit font-semibold h-12 rounded-xl transition-all"
                  onClick={() => router.push('/trainee/workouts')}
                >
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    <span>אימון נוסף</span>
                  </div>
                </Button>
                
                <Button
                  className="w-full bg-[#2D3142] hover:bg-[#3D4058] text-[#5B7FFF] font-outfit font-semibold h-12 rounded-xl transition-all"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Workout Summary",
                        text: `סיימתי עכשיו ${summary.exerciseCount} תרגילים ב-${summary.duration}! ${summary.recordsCount > 0 ? `${summary.recordsCount} שיאים חדשים!` : ''}`,
                      }).catch(console.error);
                    } else {
                      showToast('Share feature coming soon!', "info", 2000);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    <span>שתף</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutSummary() {
  return <WorkoutSummaryContent />;
}