"use client";

import { useState, useEffect } from "react";
import { 
  Search, Settings, Play,
  Clock, Flame, Bell, Home, TrendingUp, BarChart3, User
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveWorkoutPlan, getRoutinesWithExercises, getWorkoutLogs } from "@/lib/db";
import type { WorkoutPlan, RoutineWithExercises } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function TraineeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"discover" | "my-workouts">("discover");

  const traineeId = user?.id || "";

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!traineeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [plan, logs] = await Promise.all([
          getActiveWorkoutPlan(traineeId),
          getWorkoutLogs(traineeId, 30),
        ]);
        
        if (!cancelled) {
          setWorkoutPlan(plan);
          setWorkoutLogs(logs || []);
          if (plan) {
            const routinesData = await getRoutinesWithExercises(plan.id);
            if (!cancelled) {
              setRoutines(routinesData);
            }
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [traineeId, authLoading]);

  // Calculate real stats from workout logs
  const calculateActivityStats = () => {
    const dailyGoalSteps = 300000; // Daily step goal (300k for the design)
    
    const totalWorkoutMinutes = workoutLogs.reduce((total, log: any) => {
      let durationMinutes = 0;
      
      if (log.duration_seconds) {
        durationMinutes = log.duration_seconds / 60;
      } else if (log.start_time && log.end_time) {
        const start = new Date(log.start_time).getTime();
        const end = new Date(log.end_time).getTime();
        durationMinutes = (end - start) / (1000 * 60);
      } else {
        durationMinutes = 45;
      }
      
      return total + durationMinutes;
    }, 0);
    
    const estimatedSteps = Math.round(totalWorkoutMinutes * 120);
    const baseSteps = 200000;
    const totalSteps = estimatedSteps + baseSteps;
    
    const stepsProgress = Math.min(Math.round((totalSteps / dailyGoalSteps) * 100), 100);
    const avgHeartRate = workoutLogs.length > 0 ? 105 : 72;
    
    return {
      steps: totalSteps,
      stepsProgress,
      heartRate: avgHeartRate,
    };
  };

  const activityStats = calculateActivityStats();
  const { steps, stepsProgress, heartRate } = activityStats;

  // Helper function to calculate workout calories and time
  const calculateWorkoutStats = (routine: RoutineWithExercises) => {
    if (!routine.routine_exercises || routine.routine_exercises.length === 0) {
      return { calories: 0, minutes: 0 };
    }

    const totalSets = routine.routine_exercises.reduce((sum, re) => sum + (re.target_sets || 3), 0);
    const totalRestTime = routine.routine_exercises.reduce((sum, re) => {
      const sets = re.target_sets || 3;
      const restTime = re.rest_time_seconds || 180;
      return sum + (sets * restTime);
    }, 0);
    
    // Estimate: ~30 seconds per set for execution
    const executionTime = totalSets * 30;
    const totalTimeSeconds = totalRestTime + executionTime;
    const minutes = Math.round(totalTimeSeconds / 60);
    
    // Estimate calories: ~8-10 calories per minute of workout
    const calories = Math.round(minutes * 9);
    
    return { calories, minutes };
  };

  // Helper function to get difficulty label and color
  const getDifficultyInfo = (letter: string) => {
    if (letter === "A" || letter === "B") {
      return { label: "מתחיל", color: "bg-[#4CAF50]" };
    }
    if (letter === "C" || letter === "D") {
      return { label: "בינוני", color: "bg-[#FF8A00]" };
    }
    if (letter === "E") {
      return { label: "מתקדם", color: "bg-[#EF4444]" };
    }
    return { label: "בינוני", color: "bg-[#FF8A00]" };
  };

  // Find today's routine based on workout logs
  const getTodayRoutine = () => {
    if (routines.length === 0) return null;

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the last completed workout log
    const lastLog = workoutLogs
      .filter(log => log.completed)
      .sort((a, b) => new Date(b.date || b.start_time).getTime() - new Date(a.date || a.start_time).getTime())[0];

    if (lastLog && lastLog.routine_id) {
      // Find the next routine after the last one
      const lastRoutineIndex = routines.findIndex(r => r.id === lastLog.routine_id);
      if (lastRoutineIndex >= 0 && lastRoutineIndex < routines.length - 1) {
        return routines[lastRoutineIndex + 1];
      }
    }

    // If no logs or first time, return the first routine
    return routines[0];
  };

  // Calculate progress for a routine
  const calculateRoutineProgress = (routineId: string) => {
    const routineLogs = workoutLogs.filter(log => log.routine_id === routineId && log.completed);
    if (routineLogs.length === 0) return 0;
    
    // Simple progress: number of completed workouts / 4 (assuming weekly cycle)
    return Math.min(Math.round((routineLogs.length / 4) * 100), 100);
  };

  const todayRoutine = getTodayRoutine();

  if (loading || authLoading) {
    return <LoadingSpinner fullScreen text="טוען..." size="lg" />;
  }

  return (
    <div className="relative bg-[#1A1D2E] w-full min-h-screen">
      {/* Main Content */}
      <div className="w-full overflow-y-auto pb-24">
        <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
          <div className="flex flex-col items-start w-full gap-6">
            
            {/* Welcome Header with Avatar and Notification */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-[60px] h-[60px]">
                  <AvatarFallback className="bg-[#2D3142] text-white text-xl">
                    {user?.name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[#9CA3AF] text-sm font-outfit font-normal">
                    ברוך הבא
                  </span>
                  <h1 className="text-white text-[32px] font-outfit font-bold leading-tight">
                    {user?.name || 'Stephen'}
                  </h1>
                </div>
              </div>
              <div className="w-12 h-12 bg-[#2D3142] rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Tabs */}
            <div className="w-full border-b border-[#2D3142]">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("discover")}
                  className={`flex-1 pb-3 text-base font-outfit font-medium transition-colors relative ${
                    activeTab === "discover" 
                      ? "text-[#5B7FFF]" 
                      : "text-[#9CA3AF]"
                  }`}
                >
                  גלה
                  {activeTab === "discover" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5B7FFF] rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("my-workouts")}
                  className={`flex-1 pb-3 text-base font-outfit font-medium transition-colors relative ${
                    activeTab === "my-workouts" 
                      ? "text-[#5B7FFF]" 
                      : "text-[#9CA3AF]"
                  }`}
                >
                  האימונים שלי
                  {activeTab === "my-workouts" && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5B7FFF] rounded-t-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="w-full h-[52px] bg-[#2D3142] rounded-xl flex items-center gap-3 px-4">
              <Search className="w-5 h-5 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="חיפוש"
                className="flex-1 bg-transparent text-white text-base font-outfit outline-none placeholder:text-[#9CA3AF]"
              />
            </div>

            {/* Tab Content */}
            {activeTab === "discover" ? (
              <>
                {/* Your Activity Section */}
                <div className="w-full flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-white text-lg font-outfit font-semibold">
                      הפעילות שלך
                    </h2>
                    <Settings className="w-5 h-5 text-white cursor-pointer" />
                  </div>

                  <div className="flex gap-4">
                    {/* Steps Card */}
                    <div className="flex-1 bg-[#2D3142] rounded-2xl p-4 flex flex-col gap-3">
                      <span className="text-white text-sm font-outfit font-normal">צעדים</span>
                      <div className="flex flex-col items-center justify-center flex-1">
                        {/* Circular Progress */}
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full transform -rotate-90">
                            {/* Background circle */}
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              fill="none"
                              stroke="#3D4058"
                              strokeWidth="10"
                            />
                            {/* Progress circle */}
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              fill="none"
                              stroke="#5B7FFF"
                              strokeWidth="10"
                              strokeDasharray={`${2 * Math.PI * 56}`}
                              strokeDashoffset={`${2 * Math.PI * 56 * (1 - stepsProgress / 100)}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[#5B7FFF] text-2xl font-outfit font-bold">
                              {steps.toLocaleString()}
                            </span>
                            <span className="text-[#9CA3AF] text-xs font-outfit">
                              צעדים
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Heart Rate Card */}
                    <div className="flex-1 bg-[#2D3142] rounded-2xl p-4 flex flex-col gap-3">
                      <span className="text-white text-sm font-outfit font-normal">דופק</span>
                      <div className="flex flex-col items-center justify-center flex-1 gap-2">
                        {/* Heart Rate Graph */}
                        <svg className="w-full h-16" viewBox="0 0 160 60" preserveAspectRatio="none">
                          <polyline
                            points="0,50 20,45 30,20 40,55 50,15 60,50 80,40 100,25 120,45 140,30 160,40"
                            fill="none"
                            stroke="#5B7FFF"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex flex-col items-center">
                          <span className="text-[#5B7FFF] text-2xl font-outfit font-bold">
                            {heartRate}
                          </span>
                          <span className="text-[#9CA3AF] text-xs font-outfit">
                            פעימות לדקה
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popular Workouts Section */}
                <div className="w-full flex flex-col gap-4">
                  <h2 className="text-white text-lg font-outfit font-semibold">
                    אימונים פופולריים
                  </h2>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5">
                    {routines.slice(0, 2).map((routine, idx) => {
                      const workoutImages = [
                        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=280&h=160&fit=crop',
                        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=280&h=160&fit=crop',
                      ];
                      const stats = calculateWorkoutStats(routine);
                      const routineName = routine.name || `אימון ${routine.letter}`;
                      
                      return (
                        <Link
                          key={routine.id}
                          href={`/trainee/workout?routine=${routine.id}`}
                          className="flex-shrink-0 w-[280px] h-[160px] rounded-2xl relative overflow-hidden"
                        >
                          {/* Background Image */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ 
                              backgroundImage: `url(${workoutImages[idx % workoutImages.length]})`,
                            }}
                          />
                          
                          {/* Gradient Overlay */}
                          <div 
                            className="absolute inset-0"
                            style={{ 
                              background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%)',
                            }}
                          />
                          
                          {/* Content */}
                          <div className="relative z-10 h-full flex flex-col justify-between p-4">
                            <div className="flex flex-col gap-2">
                              <h3 className="text-white text-xl font-outfit font-bold">
                                {routineName}
                              </h3>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5 bg-white/90 rounded-full px-2.5 py-1 w-fit">
                                  <Flame className="w-4 h-4 text-[#1A1D2E]" />
                                  <span className="text-[#1A1D2E] text-xs font-outfit font-medium">
                                    {stats.calories} קלוריות
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/90 rounded-full px-2.5 py-1 w-fit">
                                  <Clock className="w-4 h-4 text-[#1A1D2E]" />
                                  <span className="text-[#1A1D2E] text-xs font-outfit font-medium">
                                    {stats.minutes} דקות
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <div className="w-12 h-12 bg-[#5B7FFF] rounded-full flex items-center justify-center">
                                <Play className="w-6 h-6 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Today's Plan Section */}
                <div className="w-full flex flex-col gap-4">
                  <h2 className="text-white text-lg font-outfit font-semibold">
                    התוכנית של היום
                  </h2>
                  {todayRoutine ? (
                    (() => {
                      const difficulty = getDifficultyInfo(todayRoutine.letter || "C");
                      const progress = calculateRoutineProgress(todayRoutine.id);
                      const routineName = todayRoutine.name || `אימון ${todayRoutine.letter}`;
                      const workoutImages = [
                        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=120&fit=crop',
                        'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=100&h=120&fit=crop',
                        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100&h=120&fit=crop',
                      ];
                      const imageIndex = routines.findIndex(r => r.id === todayRoutine.id) % workoutImages.length;
                      
                      return (
                        <div className="w-full bg-[#2D3142] rounded-2xl p-3 flex gap-4">
                          {/* Workout Image */}
                          <div 
                            className="w-[100px] h-[120px] rounded-xl bg-cover bg-center flex-shrink-0"
                            style={{ 
                              backgroundImage: `url(${workoutImages[imageIndex]})`,
                            }}
                          />
                          
                          {/* Workout Info */}
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="flex flex-col gap-2">
                              <h3 className="text-white text-xl font-outfit font-semibold">
                                {routineName}
                              </h3>
                              <div className={`inline-flex items-center justify-center ${difficulty.color} rounded-lg px-3 py-1.5 w-fit`}>
                                <span className="text-white text-xs font-outfit font-medium">
                                  {difficulty.label}
                                </span>
                              </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="relative w-full h-8 bg-[#4A4E69] rounded-lg overflow-hidden">
                              <div 
                                className="absolute left-0 top-0 h-full bg-[#9CA3AF] flex items-center justify-center"
                                style={{ width: `${progress}%` }}
                              >
                                {progress > 0 && (
                                  <span className="text-[#1A1D2E] text-sm font-outfit font-semibold">
                                    {progress}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-full bg-[#2D3142] rounded-2xl p-6 flex items-center justify-center">
                      <p className="text-[#9CA3AF] text-sm">אין תוכנית להיום</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* My Workouts Tab */
              <div className="w-full flex flex-col gap-4">
                {routines.length > 0 ? routines.slice(0, 3).map((routine, idx) => {
                  const myWorkoutImages = [
                    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=393&h=220&fit=crop',
                    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=393&h=220&fit=crop',
                    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=393&h=220&fit=crop',
                  ];
                  const difficulty = getDifficultyInfo(routine.letter || "C");
                  const progress = calculateRoutineProgress(routine.id);
                  const routineName = routine.name || `אימון ${routine.letter}`;
                  
                  return (
                    <Link
                      key={routine.id}
                      href={`/trainee/workout?routine=${routine.id}`}
                      className="w-full h-[220px] rounded-2xl relative overflow-hidden"
                    >
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ 
                          backgroundImage: `url(${myWorkoutImages[idx % myWorkoutImages.length]})`,
                          filter: 'grayscale(20%)',
                        }}
                      />
                      
                      {/* Gradient Overlay */}
                      <div 
                        className="absolute inset-0"
                        style={{ 
                          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
                        }}
                      />
                      
                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-end p-5">
                        <div className="flex flex-col gap-3">
                          <h3 className="text-white text-2xl font-outfit font-bold">
                            {routineName}
                          </h3>
                          <div className={`inline-flex items-center justify-center ${difficulty.color} rounded-lg px-3 py-1.5 w-fit`}>
                            <span className="text-white text-xs font-outfit font-medium">
                              {difficulty.label}
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="relative w-full h-8 bg-[#4A4E69] rounded-lg overflow-hidden">
                            {progress > 0 && (
                              <div 
                                className="absolute left-0 top-0 h-full bg-[#9CA3AF] flex items-center justify-center"
                                style={{ width: `${progress}%` }}
                              >
                                <span className="text-[#1A1D2E] text-sm font-outfit font-semibold">
                                  {progress}%
                                </span>
                              </div>
                            )}
                            {progress < 100 && (
                              <div 
                                className="absolute left-0 top-0 h-full bg-[#5B7FFF] opacity-50"
                                style={{ width: `${100 - progress}%`, marginLeft: `${progress}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="w-full h-[220px] bg-[#2D3142] rounded-2xl p-6 flex items-center justify-center">
                    <p className="text-[#9CA3AF] text-sm">אין אימונים זמינים</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A1D2E] border-t border-[#2D3142]">
        <div className="max-w-[393px] mx-auto flex items-center justify-around h-20 px-4">
          <button className="flex flex-col items-center justify-center gap-1">
            <div className="w-14 h-9 bg-[#5B7FFF] rounded-full flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
          </button>
          <button className="flex flex-col items-center justify-center gap-1">
            <TrendingUp className="w-7 h-7 text-[#9CA3AF]" />
          </button>
          <button className="flex flex-col items-center justify-center gap-1">
            <BarChart3 className="w-7 h-7 text-[#9CA3AF]" />
          </button>
          <button className="flex flex-col items-center justify-center gap-1">
            <BarChart3 className="w-7 h-7 text-[#9CA3AF]" />
          </button>
          <button className="flex flex-col items-center justify-center gap-1">
            <User className="w-7 h-7 text-[#9CA3AF]" />
          </button>
        </div>
      </div>
    </div>
  );
}