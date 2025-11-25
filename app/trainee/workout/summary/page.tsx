"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Trophy, Share2, Home, BarChart3, Users, Target, Settings, Apple, Dumbbell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getActiveWorkoutPlan,
  getRoutinesWithExercises,
  getWorkoutLogs,
} from "@/lib/db";
import type { RoutineWithExercises, Exercise } from "@/lib/types";

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
  const pathname = usePathname();
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
    volume: "נמוך",
    volumePercent: 0,
    loadDistribution: [] as Array<{ muscleGroup: string; percentage: number; weight: number }>,
    completedExercises: [] as Array<{ name: string; sets: number }>,
    personalRecords: [] as Array<{ exercise: string; weight: number }>,
  });

  useEffect(() => {
    if (user?.id) {
      loadWorkoutData();
    }
  }, [user?.id]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      // Get workout data from sessionStorage (passed from workout page)
      const storedData = sessionStorage.getItem('workoutSummaryData');
      if (!storedData) {
        router.push('/trainee/workout');
        return;
      }

      const data = JSON.parse(storedData);
      setWorkoutData(data);

      // Calculate summary statistics
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

    // Calculate total weight lifted
    let totalWeight = 0;
    const exerciseStats: Record<string, { weight: number; sets: number }> = {};
    const muscleGroupStats: Record<string, number> = {};

    exercises.forEach((exercise: ExerciseData) => {
      let exerciseWeight = 0;
      exercise.sets.forEach((set) => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        exerciseWeight += weight * reps;
      });
      
      totalWeight += exerciseWeight;
      
      if (exerciseWeight > 0) {
        exerciseStats[exercise.name] = {
          weight: exerciseWeight,
          sets: exercise.sets.filter(s => s.weight && s.reps).length,
        };
        
        // Group by muscle group
        const muscleGroup = exercise.muscleGroup || 'אחר';
        muscleGroupStats[muscleGroup] = (muscleGroupStats[muscleGroup] || 0) + exerciseWeight;
      }
    });

    // Calculate volume level
    let volume = "נמוך";
    let volumePercent = 33;
    if (totalWeight > 5000) {
      volume = "גבוה";
      volumePercent = 100;
    } else if (totalWeight > 3000) {
      volume = "בינוני";
      volumePercent = 66;
    }

    // Calculate load distribution
    const totalMuscleWeight = Object.values(muscleGroupStats).reduce((a, b) => a + b, 0);
    const loadDistribution = Object.entries(muscleGroupStats)
      .map(([muscleGroup, weight]) => ({
        muscleGroup,
        percentage: totalMuscleWeight > 0 ? Math.round((weight / totalMuscleWeight) * 100) : 0,
        weight,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Get completed exercises
    const completedExercises = Object.entries(exerciseStats).map(([name, stats]) => ({
      name,
      sets: stats.sets,
    }));

    // Check for personal records (compare with previous workouts)
    const personalRecords: Array<{ exercise: string; weight: number }> = [];
    exercises.forEach((exercise: ExerciseData) => {
      const maxWeight = Math.max(...exercise.sets.map(s => parseFloat(s.weight) || 0));
      if (maxWeight > 0 && exercise.previousPerformance?.[0]) {
        const previousMax = exercise.previousPerformance[0].weight;
        if (maxWeight > previousMax) {
          personalRecords.push({
            exercise: exercise.name,
            weight: maxWeight,
          });
        }
      }
    });

    setSummary({
      duration,
      totalWeight,
      volume,
      volumePercent,
      loadDistribution,
      completedExercises,
      personalRecords,
    });
  };

  const handleSaveWorkout = async () => {
    if (!workoutData || !user?.id) return;

    try {
      setSaving(true);

      // Clear session storage
      sessionStorage.removeItem('workoutSummaryData');

      // Redirect to dashboard
      router.push('/trainee/dashboard');

    } catch (error: any) {
      console.error('Error navigating:', error);
      alert('שגיאה במעבר לדף הבית: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setSaving(false);
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
            <p className="text-xl font-black text-foreground animate-pulse">טוען סיכום...</p>
            <p className="text-sm text-muted-foreground mt-1">מכין את סיכום האימון</p>
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

  if (!workoutData) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-400">אין נתוני אימון</p>
          <Link href="/trainee/workout">
            <Button className="mt-4 bg-[#00ff88] text-black">חזור לאימון</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Pie chart colors
  const colors = ['#00ff88', '#f97316', '#ef4444', '#3b82f6', '#a855f7'];
  let colorIndex = 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Enhanced Header - Connected to top header */}
      <div className="bg-gradient-to-r from-card to-card/95 border-b-2 border-border rounded-b-2xl sm:rounded-b-[2.5rem] px-4 sm:px-6 py-4 sm:py-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3 relative z-10">
          <Link href="/trainee/workout" className="flex-shrink-0">
            <div className="bg-background p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-md border border-border hover:bg-accent/50 transition-all active:scale-95">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">סיכום אימון</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Workout Summary</p>
          </div>
          <div className="bg-green-500/20 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl flex-shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
          </div>
        </div>
      </div>

      {/* Content with padding */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-5 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-6">
        {/* Workout Summary Card */}
        <Card className="bg-card border-2 border-border shadow-lg rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground font-medium text-sm sm:text-base">משך כולל:</p>
              <p className="text-foreground font-black text-base sm:text-lg">{summary.duration}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground font-medium text-sm sm:text-base">משקל כולל שהורם:</p>
              <p className="text-foreground font-black text-base sm:text-lg">{summary.totalWeight.toLocaleString()} ק"ג</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground font-medium text-sm sm:text-base">נפח אימון:</p>
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-foreground font-black text-sm sm:text-base">{summary.volume}</p>
                <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-accent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={`${(summary.volumePercent / 100) * 125.6} 125.6`}
                      strokeLinecap="round"
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] sm:text-xs text-foreground font-black">{summary.volumePercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Load Distribution Card */}
        {summary.loadDistribution.length > 0 && (
          <Card className="bg-card border-2 border-border shadow-lg rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms' }}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <CardTitle className="text-foreground font-black">פילוג עומס</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Pie Chart */}
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    {summary.loadDistribution.reduce((acc, item, index) => {
                      const percentage = item.percentage;
                      const offset = acc.offset;
                      const color = colors[index % colors.length];
                      const circumference = 2 * Math.PI * 56;
                      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                      
                      acc.elements.push(
                        <circle
                          key={item.muscleGroup}
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke={color}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={-offset}
                        />
                      );
                      
                      acc.offset += (percentage / 100) * circumference;
                      return acc;
                    }, { elements: [] as React.ReactElement[], offset: 0 }).elements}
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {summary.loadDistribution.map((item, index) => (
                    <div key={item.muscleGroup} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      <span className="text-gray-300 text-sm">
                        {item.muscleGroup} {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Exercises Card */}
        <Card className="bg-[#1a2332] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">תרגילים שהושלמו</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.completedExercises.map((exercise, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00ff88] flex-shrink-0" />
                <span className="text-gray-300">
                  {exercise.name} ({exercise.sets} סטים)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Personal Records Card */}
        {summary.personalRecords.length > 0 && (
          <Card className="bg-[#1a2332] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">שיאים אישיים חדשים!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.personalRecords.map((record, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="text-gray-300">
                    {record.exercise}: {record.weight} ק"ג!
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full bg-[#00ff88] hover:bg-[#00e677] text-black font-bold h-14 text-lg"
            onClick={handleSaveWorkout}
            disabled={saving}
          >
            {saving ? "מעביר..." : "חזרה לדף הבית"}
          </Button>
          
          <div className="text-center">
            <button className="text-[#00ff88] hover:text-[#00e677] text-sm">
              שיתוף אימון
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function WorkoutSummary() {
  return <WorkoutSummaryContent />;
}

