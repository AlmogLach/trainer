"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scale, Edit, Eye, TrendingUp, Loader2, Mail, Phone, Calendar, ChevronDown, ChevronUp, Dumbbell, Users, Activity, Trophy, AlertCircle, Filter, ArrowUpDown, Lightbulb, X, BarChart3, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  getUser,
  getActiveWorkoutPlan,
  getWorkoutLogs,
  getBodyWeightHistory,
} from "@/lib/db";
import type { User, WorkoutLogWithDetails } from "@/lib/types";
import { SimpleLineChart } from "@/components/ui/SimpleLineChart";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Stat Card Component ---
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
  
  const theme = themes[colorTheme as keyof typeof themes] || themes.blue;

  return (
    <Card className={`relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all ${theme.bg} backdrop-blur-md`}>
      <CardContent className="p-4 sm:p-5 flex flex-col h-28 sm:h-32 justify-between">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <h3 className={`text-xs sm:text-sm font-medium ${theme.text} tracking-wide opacity-90`}>{title}</h3>
          <div className={`p-1.5 sm:p-2 rounded-xl ${theme.iconBg} ${theme.text} shadow-sm backdrop-blur-sm`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className={`text-2xl sm:text-3xl font-black ${theme.text} tracking-tight flex items-baseline gap-1.5`}>
            {value}
            {subValue && <span className={`text-xs sm:text-sm font-semibold ${theme.subText}`}>{subValue}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Skeleton Components ---
function SkeletonStatCard() {
  return (
    <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-gray-200/80 to-gray-300/50 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-md">
      <CardContent className="p-4 sm:p-5 flex flex-col h-28 sm:h-32 justify-between">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-xl" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonProfileCard() {
  return (
    <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-48 sm:w-64" />
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 sm:gap-6">
          <Skeleton className="h-16 w-16 sm:h-24 sm:w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-32 sm:w-40" />
            <Skeleton className="h-4 w-40 sm:w-48" />
            <Skeleton className="h-4 w-36 sm:w-44" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonWorkoutCard() {
  return (
    <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl">
      <CardHeader>
        <Skeleton className="h-5 w-32 sm:w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-3/4" />
      </CardContent>
    </Card>
  );
}

type DateFilter = 'week' | 'month' | '3months' | 'all';
type RoutineFilter = 'all' | string;
type StatusFilter = 'all' | 'completed' | 'incomplete';
type SortBy = 'date-desc' | 'date-asc' | 'sets-desc' | 'sets-asc' | 'volume-desc' | 'volume-asc';

function TraineeManagementPageContent() {
  const params = useParams();
  const traineeId = params.id as string;
  const { user } = useAuth();
  const { showToast } = useToast();

  // State for real data from Supabase
  const [trainee, setTrainee] = useState<User | null>(null);
  const [weeklyWeights, setWeeklyWeights] = useState<Array<{ date: string; weight: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogWithDetails[]>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  
  // Filters and sorting
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [routineFilter, setRoutineFilter] = useState<RoutineFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');

  // Get trainer ID from authenticated user
  const TRAINER_ID = user?.id;

  // Load all data from Supabase
  useEffect(() => {
    loadData();
  }, [traineeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load trainee
      const traineeData = await getUser(traineeId);
      setTrainee(traineeData);

      // Load weight history
      const weights = await getBodyWeightHistory(traineeId);
      setWeeklyWeights(weights);

      // Load workout plan
      const plan = await getActiveWorkoutPlan(traineeId);
      setWorkoutPlan(plan);

      // Load workout logs
      const logs = await getWorkoutLogs(traineeId);
      setWorkoutLogs(logs);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };


  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format date and time for workout logs
  const formatWorkoutDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `היום, ${date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `אתמול, ${date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Calculate workout completion percentage
  const getWorkoutCompletion = (workout: WorkoutLogWithDetails) => {
    if (!workout.set_logs || workout.set_logs.length === 0) return 0;
    // Simple calculation - you can make it more sophisticated
    return Math.min(100, Math.round((workout.set_logs.length / 10) * 100));
  };

  // Toggle workout expansion
  const toggleWorkoutExpansion = (workoutId: string) => {
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  // Group sets by exercise
  const groupSetsByExercise = (setLogs: WorkoutLogWithDetails['set_logs']) => {
    const grouped: Record<string, typeof setLogs> = {};
    setLogs.forEach(setLog => {
      const exerciseName = setLog.exercise?.name || 'תרגיל לא ידוע';
      if (!grouped[exerciseName]) {
        grouped[exerciseName] = [];
      }
      grouped[exerciseName].push(setLog);
    });
    return grouped;
  };

  // Calculate Quick Stats
  const quickStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    // Calculate workouts this week
    const workoutsThisWeek = workoutLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && log.completed;
    }).length;
    
    // Calculate compliance (simplified - based on expected workouts per week)
    // Assuming 3-4 workouts per week is expected
    const expectedWorkoutsPerWeek = 3;
    const compliance = workoutsThisWeek >= expectedWorkoutsPerWeek 
      ? 100 
      : Math.round((workoutsThisWeek / expectedWorkoutsPerWeek) * 100);
    
    // Calculate PRs this week (simplified)
    const prsThisWeek = 0; // TODO: Calculate from workout logs
    
    // Get current weight
    const currentWeight = weeklyWeights.length > 0 
      ? weeklyWeights[weeklyWeights.length - 1].weight 
      : null;
    
    // Get last workout date
    const completedWorkouts = workoutLogs.filter(log => log.completed);
    const lastWorkoutDate = completedWorkouts.length > 0
      ? completedWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : null;
    
    return {
      compliance,
      workoutsThisWeek,
      prsThisWeek,
      currentWeight,
      lastWorkoutDate,
      hasActivePlan: !!workoutPlan,
      totalWorkouts: completedWorkouts.length,
    };
  }, [workoutLogs, weeklyWeights, workoutPlan]);

  // Calculate Personal Records
  const personalRecords = useMemo(() => {
    if (workoutLogs.length === 0) return [];
    
    const prs: Array<{
      exerciseId: string;
      exerciseName: string;
      newWeight: number;
      previousWeight: number;
      date: string;
    }> = [];
    
    // Group sets by exercise and find max weights
    const exerciseMaxWeights = new Map<string, { weight: number; date: string }[]>();
    
    workoutLogs
      .filter(log => log.completed && log.set_logs)
      .forEach(log => {
        log.set_logs.forEach(setLog => {
          if (!setLog.exercise) return;
          const exerciseId = setLog.exercise.id || setLog.exercise_id;
          const exerciseName = setLog.exercise.name || 'תרגיל לא ידוע';
          
          if (!exerciseMaxWeights.has(exerciseId)) {
            exerciseMaxWeights.set(exerciseId, []);
          }
          
          exerciseMaxWeights.get(exerciseId)!.push({
            weight: setLog.weight_kg,
            date: log.date,
          });
        });
      });
    
    // Find PRs (new max weight compared to previous max)
    exerciseMaxWeights.forEach((weights, exerciseId) => {
      const sortedWeights = weights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const exerciseName = workoutLogs
        .flatMap(log => log.set_logs || [])
        .find(set => (set.exercise?.id || set.exercise_id) === exerciseId)?.exercise?.name || 'תרגיל לא ידוע';
      
      let previousMax = 0;
      sortedWeights.forEach(({ weight, date }) => {
        if (weight > previousMax && previousMax > 0) {
          prs.push({
            exerciseId,
            exerciseName,
            newWeight: weight,
            previousWeight: previousMax,
            date,
          });
        }
        previousMax = Math.max(previousMax, weight);
      });
    });
    
    return prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workoutLogs]);

  // Calculate Insights
  const insights = useMemo(() => {
    const insightsList: string[] = [];
    
    if (quickStats.workoutsThisWeek > 0) {
      insightsList.push(`בוצעו ${quickStats.workoutsThisWeek} אימונים השבוע`);
    }
    
    if (personalRecords.length > 0) {
      const prsThisWeek = personalRecords.filter(pr => {
        const prDate = new Date(pr.date);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return prDate >= weekStart;
      }).length;
      if (prsThisWeek > 0) {
        insightsList.push(`${prsThisWeek} Personal Records השבוע - כל הכבוד!`);
      }
    }
    
    if (quickStats.lastWorkoutDate) {
      const daysSinceLastWorkout = Math.floor(
        (new Date().getTime() - new Date(quickStats.lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastWorkout > 3) {
        insightsList.push(`לא בוצע אימון ב-${daysSinceLastWorkout} ימים`);
      }
    }
    
    // Weight trend
    if (weeklyWeights.length >= 2) {
      const recent = weeklyWeights.slice(-1)[0].weight;
      const previous = weeklyWeights.slice(-2)[0].weight;
      const diff = recent - previous;
      if (Math.abs(diff) > 0.5) {
        insightsList.push(`משקל ${diff > 0 ? 'עלה' : 'ירד'} ב-${Math.abs(diff).toFixed(1)} ק"ג החודש`);
      }
    }
    
    return insightsList;
  }, [quickStats, personalRecords, weeklyWeights]);

  // Filter and sort workout logs
  const filteredAndSortedWorkouts = useMemo(() => {
    let filtered = [...workoutLogs];
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();
      switch (dateFilter) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }
      filtered = filtered.filter(log => new Date(log.date) >= startDate);
    }
    
    // Routine filter
    if (routineFilter !== 'all') {
      filtered = filtered.filter(log => log.routine_id === routineFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => 
        statusFilter === 'completed' ? log.completed : !log.completed
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'sets-desc':
          return (b.set_logs?.length || 0) - (a.set_logs?.length || 0);
        case 'sets-asc':
          return (a.set_logs?.length || 0) - (b.set_logs?.length || 0);
        case 'volume-desc':
          const volumeB = (b.set_logs || []).reduce((sum, set) => sum + (set.weight_kg * set.reps), 0);
          const volumeA = (a.set_logs || []).reduce((sum, set) => sum + (set.weight_kg * set.reps), 0);
          return volumeB - volumeA;
        case 'volume-asc':
          const volumeA2 = (a.set_logs || []).reduce((sum, set) => sum + (set.weight_kg * set.reps), 0);
          const volumeB2 = (b.set_logs || []).reduce((sum, set) => sum + (set.weight_kg * set.reps), 0);
          return volumeA2 - volumeB2;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [workoutLogs, dateFilter, routineFilter, statusFilter, sortBy]);

  // Get unique routines for filter
  const uniqueRoutines = useMemo(() => {
    const routines = new Map<string, { id: string; name: string }>();
    workoutLogs.forEach(log => {
      if (log.routine && !routines.has(log.routine_id)) {
        routines.set(log.routine_id, {
          id: log.routine_id,
          name: log.routine.name || `רוטינה ${log.routine.letter}`,
        });
      }
    });
    return Array.from(routines.values());
  }, [workoutLogs]);

  // Ensure user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-6 pb-32" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          <SkeletonProfileCard />
          <SkeletonWorkoutCard />
          <SkeletonWorkoutCard />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !trainee) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-6 pb-32" dir="rtl">
        <div className="max-w-6xl mx-auto pt-8">
          <Card className="bg-white dark:bg-slate-900/50 border-red-200 dark:border-red-800 shadow-md rounded-xl sm:rounded-2xl">
            <CardContent className="pt-6 pb-6 text-center">
              <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
              <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                {error || "לא נמצא מתאמן"}
              </p>
              <Link href="/trainer/trainees">
                <Button variant="outline" className="mt-4 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  חזור לרשימת המתאמנים
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6 pb-32" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Link href="/trainer/trainees">
            <Button variant="ghost" size="icon" className="text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            פרופיל מתאמן
          </h1>
        </div>

        {/* Trainee Profile Section - Enhanced */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-md rounded-xl sm:rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
              {trainee.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Profile Picture */}
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white dark:border-slate-800 shadow-lg">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-black text-2xl sm:text-3xl">
                  {trainee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* Profile Details */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-slate-300">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{trainee.email || "אין אימייל"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-slate-300">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>הצטרף: {formatDate(trainee.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600 dark:text-slate-300">
                  <Dumbbell className="h-4 w-4 flex-shrink-0" />
                  <span>סה״כ אימונים: {quickStats.totalWorkouts}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base text-gray-600 dark:text-slate-300">תוכנית:</span>
                  <span className={`text-sm sm:text-base font-bold ${
                    workoutPlan ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-slate-400'
                  }`}>
                    {workoutPlan?.name || "אין תוכנית"}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {workoutPlan && (
                  <Link href={`/trainer/workout-plans/${traineeId}/edit`} className="flex-1 sm:flex-none">
                    <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                      <Edit className="h-4 w-4 mr-2" />
                      ערוך תוכנית
                    </Button>
                  </Link>
                )}
                <Link href={`/trainer/reports?trainee=${traineeId}`} className="flex-1 sm:flex-none">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    דוחות
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 sm:flex-none"
                  onClick={() => showToast('שליחת הודעה תתווסף בהמשך', 'info')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  הודעה
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights Card */}
        {insights.length > 0 && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-md rounded-xl sm:rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                תובנות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 sm:p-3 bg-white dark:bg-slate-900/50 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-gray-900 dark:text-white">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Personal Records Card */}
        {personalRecords.length > 0 && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 shadow-md rounded-xl sm:rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                Personal Records ({personalRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {personalRecords.slice(0, 5).map((pr, idx) => (
                <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-slate-900/50 rounded-lg">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                      {pr.exerciseName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">
                        {pr.newWeight} ק"ג
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">←</span>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 line-through">
                        {pr.previousWeight} ק"ג
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">
                        • {formatDate(pr.date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Biometric Data Section */}
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
              נתונים ביומטריים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyWeights.length > 0 ? (
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-4">התקדמות משקל גוף</h3>
                <SimpleLineChart 
                  data={weeklyWeights} 
                  height={200}
                  chartWidth={600}
                  yAxisSteps={4}
                  useThemeColors={true}
                  unit="kg"
                  className="pb-2 scrollbar-hide"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <Scale className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2">
                  אין נתוני משקל
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                  המתאמן עדיין לא הזין משקל גוף
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts with Filters */}
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                אימונים אחרונים
              </CardTitle>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {dateFilter === 'all' ? 'תאריך' : dateFilter === 'week' ? 'השבוע' : dateFilter === 'month' ? 'החודש' : '3 חודשים'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setDateFilter('all')}>
                      כל הזמן
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter('week')}>
                      השבוע
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter('month')}>
                      החודש
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter('3months')}>
                      3 חודשים
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {uniqueRoutines.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                        <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        {routineFilter === 'all' ? 'רוטינה' : uniqueRoutines.find(r => r.id === routineFilter)?.name || 'רוטינה'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setRoutineFilter('all')}>
                        כל הרוטינות
                      </DropdownMenuItem>
                      {uniqueRoutines.map(routine => (
                        <DropdownMenuItem key={routine.id} onClick={() => setRoutineFilter(routine.id)}>
                          {routine.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                      <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {statusFilter === 'all' ? 'סטטוס' : statusFilter === 'completed' ? 'הושלם' : 'לא הושלם'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                      הכל
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                      הושלם
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('incomplete')}>
                      לא הושלם
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                      <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      מיון
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setSortBy('date-desc')}>
                      תאריך (חדש לישן)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('date-asc')}>
                      תאריך (ישן לחדש)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('sets-desc')}>
                      סטים (הרבה למעט)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('sets-asc')}>
                      סטים (מעט להרבה)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('volume-desc')}>
                      נפח (גבוה לנמוך)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('volume-asc')}>
                      נפח (נמוך לגבוה)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {(dateFilter !== 'all' || routineFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFilter('all');
                      setRoutineFilter('all');
                      setStatusFilter('all');
                    }}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    נקה
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {filteredAndSortedWorkouts.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <Dumbbell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {workoutLogs.length === 0 ? 'אין אימונים עדיין' : 'לא נמצאו תוצאות'}
                  </p>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mb-6">
                    {workoutLogs.length === 0 
                      ? 'המתאמן עדיין לא ביצע אימונים' 
                      : 'נסה לשנות את הפילטרים'}
                  </p>
                  {workoutLogs.length === 0 && workoutPlan && (
                    <Link href={`/trainer/workout-plans/${traineeId}/edit`}>
                      <Button variant="outline" className="gap-2">
                        <Eye className="h-4 w-4" />
                        צפה בתוכנית
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                filteredAndSortedWorkouts.slice(0, 10).map((workout) => {
                  const isExpanded = expandedWorkouts.has(workout.id);
                  const groupedSets = workout.set_logs ? groupSetsByExercise(workout.set_logs) : {};
                  
                  return (
                    <Card key={workout.id} className="border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden rounded-lg sm:rounded-xl">
                      {/* Workout Header */}
                      <div 
                        className="bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => toggleWorkoutExpansion(workout.id)}
                      >
                        <div className="flex items-center justify-between p-3 sm:p-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-slate-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                                  {workout.routine ? `אימון ${workout.routine.letter}${workout.routine.name ? ` - ${workout.routine.name}` : ''}` : 'אימון'}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                                  {formatWorkoutDate(workout.date)}
                                </span>
                                {workout.completed ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                    הושלם
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                    לא הושלם
                                  </span>
                                )}
                              </div>
                              {workout.set_logs && workout.set_logs.length > 0 && (
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-slate-400">
                                  <span>{workout.set_logs.length} סטים</span>
                                  <span>•</span>
                                  <span>{Object.keys(groupedSets).length} תרגילים</span>
                                  <span>•</span>
                                  <span>
                                    {workout.set_logs.reduce((total, set) => 
                                      total + (set.weight_kg * set.reps), 0
                                    ).toFixed(0)} ק"ג נפח
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Workout Details */}
                      {isExpanded && workout.set_logs && workout.set_logs.length > 0 && (
                        <div className="bg-white dark:bg-slate-900/50 p-3 sm:p-4 space-y-3 sm:space-y-4 border-t border-gray-200 dark:border-slate-800">
                          {Object.entries(groupedSets).map(([exerciseName, sets]) => (
                            <div key={exerciseName} className="border border-gray-200 dark:border-slate-800 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-slate-800/50">
                              <div className="flex items-center gap-2 mb-3">
                                <Dumbbell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{exerciseName}</h4>
                                <span className="text-xs text-gray-500 dark:text-slate-400">({sets.length} סטים)</span>
                              </div>
                              <div className="space-y-2">
                                {sets.map((setLog, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-slate-900/50 rounded border border-gray-200 dark:border-slate-800"
                                  >
                                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
                                      <span className="text-gray-500 dark:text-slate-400 font-medium">סט {idx + 1}</span>
                                      <span className="text-gray-900 dark:text-white font-bold">
                                        {setLog.weight_kg > 0 ? `${setLog.weight_kg} ק"ג` : 'משקל גוף'}
                                      </span>
                                      <span className="text-gray-400 dark:text-slate-500">×</span>
                                      <span className="text-gray-900 dark:text-white font-bold">{setLog.reps} חזרות</span>
                                      {setLog.rir_actual !== null && (
                                        <>
                                          <span className="text-gray-400 dark:text-slate-500 mx-1">•</span>
                                          <span className="text-gray-500 dark:text-slate-400">RIR: {setLog.rir_actual}</span>
                                        </>
                                      )}
                                    </div>
                                    {setLog.notes && (
                                      <span className="text-xs text-gray-500 dark:text-slate-400 max-w-xs truncate" title={setLog.notes}>
                                        {setLog.notes}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {/* Workout Summary */}
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
                            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                              <div>
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mb-1">סה״כ סטים</p>
                                <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{workout.set_logs.length}</p>
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mb-1">סה״כ תרגילים</p>
                                <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{Object.keys(groupedSets).length}</p>
                              </div>
                              <div>
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 mb-1">סה״כ נפח</p>
                                <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                                  {workout.set_logs.reduce((total, set) => 
                                    total + (set.weight_kg * set.reps), 0
                                  ).toFixed(0)} ק"ג
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TraineeManagementPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TraineeManagementPageContent />
    </ProtectedRoute>
  );
}
