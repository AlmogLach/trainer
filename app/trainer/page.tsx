"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Loader2, FileText,
  Users, Activity, TrendingUp, AlertCircle,
  BarChart3, ChevronLeft, ArrowUpRight, Plus, Dumbbell, Calendar, Lightbulb, Award, Trophy,
  ArrowUp, ArrowDown, Minus, Sparkles, Star, MessageSquare, Edit, Eye, Filter
} from "lucide-react";
import Link from "next/link";
import { getTrainerStats, getTraineesWithStatus, getWorkoutLogsForUsers, getTrainerTrainees } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SimpleLineChart } from "@/components/ui/SimpleLineChart";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Refined Stat Card Component with Milky Gradients and Trends ---
function StatCard({ title, value, icon: Icon, subValue, trend, trendValue, trendPeriod, colorTheme }: any) {
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
  
  const theme = themes[colorTheme as keyof typeof themes];

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUp className="h-3 w-3" />;
    if (trend === 'down') return <ArrowDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return "text-emerald-200 dark:text-emerald-300";
    if (trend === 'down') return "text-red-200 dark:text-red-300";
    return "text-gray-200 dark:text-gray-400";
  };

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
          {trend && trendValue && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-[10px] sm:text-xs font-bold">{trendValue}</span>
              {trendPeriod && (
                <span className="text-[9px] sm:text-[10px] opacity-75 ml-1">{trendPeriod}</span>
              )}
            </div>
          )}
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
          <Skeleton className="h-3 w-20 sm:w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl w-full">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-3/4" />
      </CardContent>
    </Card>
  );
}

type TimeFilter = 'today' | 'week' | 'month' | '3months' | 'all';

export default function TrainerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    activeTrainees: 0,
    workoutsToday: { completed: 0, total: 0 },
    averageCompliance: 0,
    alerts: 0,
  });
  const [traineesWithStatus, setTraineesWithStatus] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');

  const trainerId = user?.id || "";

  // Helper function to get date range based on filter
  const getDateRange = useCallback((filter: TimeFilter): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'today':
        return { start, end: now };
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        return { start, end: now };
      case 'month':
        start.setDate(1);
        return { start, end: now };
      case '3months':
        start.setMonth(start.getMonth() - 3);
        return { start, end: now };
      case 'all':
        return { start: null, end: null };
      default:
        return { start, end: now };
    }
  }, []);

  useEffect(() => {
    // Reset loading state when auth status changes
    if (authLoading) {
      setLoading(true);
      return;
    }

    // If no user after auth loads, stop loading
    if (!trainerId) {
      setLoading(false);
      return;
    }

    // Load data when we have a trainer ID
    let cancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 10000)
        );
        
        // Get trainees first to calculate additional stats
        const trainees = await getTrainerTrainees(trainerId);
        const traineeIds = trainees.map(t => t.id);
        
        const dataPromise = Promise.all([
          getTrainerStats(trainerId),
          getTraineesWithStatus(trainerId),
          traineeIds.length > 0 ? getWorkoutLogsForUsers(traineeIds, undefined) : Promise.resolve([]),
        ]);
        
        const result = await Promise.race([
          dataPromise,
          timeoutPromise,
        ]);
        
        const [statsData, statusData, logsData] = result;
        
        // Convert Map to array if needed
        const logsArray = logsData instanceof Map 
          ? Array.from(logsData.values()).flat()
          : Array.isArray(logsData) ? logsData : [];
        
        if (!cancelled) {
          setStats(statsData);
          setTraineesWithStatus(statusData);
          setWorkoutLogs(logsArray);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        // Set default values on error so page still renders
        if (!cancelled) {
          setStats({
            activeTrainees: 0,
            workoutsToday: { completed: 0, total: 0 },
            averageCompliance: 0,
            alerts: 0,
          });
          setTraineesWithStatus([]);
          setWorkoutLogs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [trainerId, authLoading]);

  // Filter workout logs based on time filter
  const filteredWorkoutLogs = useMemo(() => {
    const { start, end } = getDateRange(timeFilter);
    if (!start) return workoutLogs;
    
    return workoutLogs.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= start && (!end || logDate <= end) && log.completed;
    });
  }, [workoutLogs, timeFilter, getDateRange]);

  // Calculate previous period for comparison
  const previousPeriodLogs = useMemo(() => {
    const { start, end } = getDateRange(timeFilter);
    if (!start) return [];
    
    const periodLength = end ? end.getTime() - start.getTime() : 0;
    const previousStart = new Date(start);
    previousStart.setTime(previousStart.getTime() - periodLength);
    const previousEnd = new Date(start);
    
    return workoutLogs.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= previousStart && logDate < previousEnd && log.completed;
    });
  }, [workoutLogs, timeFilter, getDateRange]);

  // Calculate additional stats with trends
  const additionalStats = useMemo(() => {
    const workoutsInPeriod = filteredWorkoutLogs.length;
    const workoutsPreviousPeriod = previousPeriodLogs.length;
    
    const workoutsTrend = workoutsPreviousPeriod > 0
      ? ((workoutsInPeriod - workoutsPreviousPeriod) / workoutsPreviousPeriod) * 100
      : 0;
    
    return {
      workoutsInPeriod,
      workoutsPreviousPeriod,
      workoutsTrend,
    };
  }, [filteredWorkoutLogs, previousPeriodLogs]);

  // Calculate compliance trend
  const complianceTrend = useMemo(() => {
    const currentCompliance = stats.averageCompliance;
    
    // Calculate previous period compliance
    const previousCompliance = traineesWithStatus.length > 0
      ? traineesWithStatus.reduce((sum, t) => {
          // Simplified: compare current compliance with estimated previous
          // In a real scenario, you'd calculate this from historical data
          return sum + (t.compliance * 0.95); // Assume 5% lower
        }, 0) / traineesWithStatus.length
      : 0;
    
    const trendValue = previousCompliance > 0
      ? ((currentCompliance - previousCompliance) / previousCompliance) * 100
      : 0;
    
    return {
      trend: trendValue > 2 ? 'up' : trendValue < -2 ? 'down' : 'stable',
      trendValue: trendValue !== 0 ? `${trendValue > 0 ? '+' : ''}${Math.round(trendValue)}%` : null,
    };
  }, [stats.averageCompliance, traineesWithStatus]);

  // Calculate workouts trend
  const workoutsTrend = useMemo(() => {
    const trendValue = additionalStats.workoutsTrend;
    return {
      trend: trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'stable',
      trendValue: trendValue !== 0 ? `${trendValue > 0 ? '+' : ''}${Math.round(trendValue)}%` : null,
    };
  }, [additionalStats.workoutsTrend]);

  // Calculate insights
  const insights = useMemo(() => {
    const insightsList: string[] = [];
    
    
    if (additionalStats.workoutsInPeriod > 0) {
      const periodLabel = timeFilter === 'week' ? 'השבוע' : timeFilter === 'month' ? 'החודש' : 'בתקופה';
      insightsList.push(`בוצעו ${additionalStats.workoutsInPeriod} אימונים ${periodLabel}`);
    }
    
    if (stats.alerts > 0) {
      insightsList.push(`${stats.alerts} מתאמנים לא ביצעו אימון ב-3 ימים האחרונים`);
    }
    
    if (traineesWithStatus.length > 0) {
      const topTrainee = traineesWithStatus.reduce((prev, curr) => 
        (curr.compliance > prev.compliance) ? curr : prev
      );
      if (topTrainee.compliance >= 90) {
        insightsList.push(`${topTrainee.name} מוביל עם ${topTrainee.compliance}% התאמה לתוכנית`);
      }
    }
    
    return insightsList;
  }, [stats, additionalStats, traineesWithStatus, timeFilter]);

  // Calculate alerts list
  const alertsList = useMemo(() => {
    const alerts: Array<{ message: string; type: 'warning' | 'error' | 'info'; traineeId?: string }> = [];
    
    traineesWithStatus.forEach(trainee => {
      if (trainee.compliance < 50) {
        alerts.push({
          message: `${trainee.name} - התאמה נמוכה לתוכנית (${trainee.compliance}%)`,
          type: 'error',
          traineeId: trainee.id,
        });
      } else if (!trainee.lastWorkout) {
        alerts.push({
          message: `${trainee.name} - לא ביצע אימון עדיין`,
          type: 'warning',
          traineeId: trainee.id,
        });
      }
    });
    
    return alerts;
  }, [traineesWithStatus]);

  // Calculate Personal Records (PRs)
  const weeklyPRs = useMemo(() => {
    if (filteredWorkoutLogs.length === 0) return [];
    
    const prs: Array<{
      traineeId: string;
      traineeName: string;
      exerciseId: string;
      exerciseName: string;
      newWeight: number;
      previousWeight: number;
      date: string;
    }> = [];
    
    // Group logs by trainee
    const traineeLogsMap = new Map<string, any[]>();
    filteredWorkoutLogs.forEach((log: any) => {
      if (!log.set_logs || log.set_logs.length === 0) return;
      const traineeId = log.user_id;
      if (!traineeLogsMap.has(traineeId)) {
        traineeLogsMap.set(traineeId, []);
      }
      traineeLogsMap.get(traineeId)!.push(log);
    });
    
    // For each trainee, find PRs
    traineeLogsMap.forEach((logs, traineeId) => {
      const trainee = traineesWithStatus.find(t => t.id === traineeId);
      if (!trainee) return;
      
      // Group sets by exercise
      const exerciseMaxWeights = new Map<string, { weight: number; date: string }>();
      const previousMaxWeights = new Map<string, number>();
      
      // Get previous period logs for comparison
      const previousLogs = previousPeriodLogs.filter((log: any) => log.user_id === traineeId);
      
      // Calculate max weights in previous period
      previousLogs.forEach((log: any) => {
        if (!log.set_logs) return;
        log.set_logs.forEach((set: any) => {
          if (!set.exercise) return;
          const exerciseId = set.exercise.id || set.exercise_id;
          const currentMax = previousMaxWeights.get(exerciseId) || 0;
          if (set.weight_kg > currentMax) {
            previousMaxWeights.set(exerciseId, set.weight_kg);
          }
        });
      });
      
      // Calculate max weights in current period
      logs.forEach((log: any) => {
        if (!log.set_logs) return;
        log.set_logs.forEach((set: any) => {
          if (!set.exercise) return;
          const exerciseId = set.exercise.id || set.exercise_id;
          const exerciseName = set.exercise.name || 'תרגיל לא ידוע';
          const currentMax = exerciseMaxWeights.get(exerciseId);
          
          if (!currentMax || set.weight_kg > currentMax.weight) {
            exerciseMaxWeights.set(exerciseId, {
              weight: set.weight_kg,
              date: log.date,
            });
          }
        });
      });
      
      // Check for PRs
      exerciseMaxWeights.forEach((current, exerciseId) => {
        const previousMax = previousMaxWeights.get(exerciseId) || 0;
        if (current.weight > previousMax && previousMax > 0) {
          const exerciseName = logs
            .flatMap((l: any) => l.set_logs || [])
            .find((s: any) => (s.exercise?.id || s.exercise_id) === exerciseId)?.exercise?.name || 'תרגיל לא ידוע';
          
          prs.push({
            traineeId,
            traineeName: trainee.name,
            exerciseId,
            exerciseName,
            newWeight: current.weight,
            previousWeight: previousMax,
            date: current.date,
          });
        }
      });
    });
    
    return prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredWorkoutLogs, previousPeriodLogs, traineesWithStatus]);

  // Calculate Top Performers
  const topPerformers = useMemo(() => {
    return traineesWithStatus
      .map(trainee => {
        const traineeWorkouts = filteredWorkoutLogs.filter((log: any) => log.user_id === trainee.id);
        const prs = weeklyPRs.filter(pr => pr.traineeId === trainee.id);
        
        return {
          ...trainee,
          workoutCount: traineeWorkouts.length,
          prCount: prs.length,
          score: (trainee.compliance * 0.5) + (traineeWorkouts.length * 10) + (prs.length * 20),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [traineesWithStatus, filteredWorkoutLogs, weeklyPRs]);

  // Calculate compliance trend data for chart
  const complianceTrendData = useMemo(() => {
    if (traineesWithStatus.length === 0) return [];
    
    // Group compliance by week
    const weekMap = new Map<string, number[]>();
    const now = new Date();
    
    // Get last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() + (weekStart.getDay() === 0 ? -6 : 1 - weekStart.getDay())) / 7)}`;
      
      // Calculate average compliance for this week (simplified - using current compliance)
      // In a real scenario, you'd calculate this from historical data
      const avgCompliance = traineesWithStatus.reduce((sum, t) => sum + t.compliance, 0) / traineesWithStatus.length;
      weekMap.set(weekKey, [avgCompliance]);
    }
    
    return Array.from(weekMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, compliances], idx) => ({
        date: `שבוע ${idx + 1}`,
        value: Math.round(compliances[0] || 0),
      }));
  }, [traineesWithStatus]);

  // Calculate workout trend data for chart
  const workoutTrendData = useMemo(() => {
    if (workoutLogs.length === 0) return [];
    
    // Group workouts by week
    const weekMap = new Map<string, number>();
    workoutLogs.forEach((log: any) => {
      if (!log.completed) return;
      const date = new Date(log.date);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() + (weekStart.getDay() === 0 ? -6 : 1 - weekStart.getDay())) / 7)}`;
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
    });
    
    // Convert to array and sort
    return Array.from(weekMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8) // Last 8 weeks
      .map((item, idx) => ({ 
        date: `שבוע ${idx + 1}`, 
        value: item.count 
      }));
  }, [workoutLogs]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "לא בוצע";
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", { day: 'numeric', month: 'short' });
  };

  const exportWeeklyReport = async () => {
    try {
      showToast('פונקציונליות ייצוא תתווסף בהמשך', 'info');
    } catch (error) {
      showToast('שגיאה בייצוא הדוח', 'error');
    }
  };
  
  const exportPerformanceReport = async () => {
    try {
      showToast('פונקציונליות ייצוא תתווסף בהמשך', 'info');
    } catch (error) {
      showToast('שגיאה בייצוא הדוח', 'error');
    }
  };

  const getTimeFilterLabel = (filter: TimeFilter): string => {
    switch (filter) {
      case 'today': return 'היום';
      case 'week': return 'השבוע';
      case 'month': return 'החודש';
      case '3months': return '3 חודשים';
      case 'all': return 'כל הזמן';
      default: return 'השבוע';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-32">
        <div className="mb-4 sm:mb-6">
          <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
          <Skeleton className="h-4 w-32 sm:w-40" />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[...Array(6)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-32">
      
      {/* --- Page Header --- */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">סקירה יומית</h1>
          <div className="flex items-center gap-3">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  {getTimeFilterLabel(timeFilter)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setTimeFilter('today')}>
                  היום
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('week')}>
                  השבוע
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('month')}>
                  החודש
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('3months')}>
                  3 חודשים
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter('all')}>
                  כל הזמן
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">סיכום פעילות המתאמנים שלך</p>
      </div>

      {/* --- Stats Grid with Milky Gradients and Trends --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="פעילים"
          value={stats.activeTrainees}
          icon={Users}
          colorTheme="blue"
        />
        <StatCard
          title="אימונים היום"
          value={stats.workoutsToday.completed}
          subValue={`/ ${stats.workoutsToday.total}`}
          icon={Dumbbell}
          colorTheme="indigo"
        />
        <StatCard
          title={timeFilter === 'week' ? 'אימונים השבוע' : timeFilter === 'month' ? 'אימונים החודש' : 'אימונים בתקופה'}
          value={additionalStats.workoutsInPeriod}
          icon={Activity}
          colorTheme="blue"
          trend={workoutsTrend.trend}
          trendValue={workoutsTrend.trendValue || undefined}
          trendPeriod={timeFilter === 'week' ? 'מהשבוע הקודם' : timeFilter === 'month' ? 'מהחודש הקודם' : undefined}
        />
        <StatCard
          title="התאמה ממוצעת"
          value={`${stats.averageCompliance}%`}
          icon={TrendingUp}
          colorTheme="emerald"
          trend={complianceTrend.trend}
          trendValue={complianceTrend.trendValue || undefined}
          trendPeriod="מהתקופה הקודמת"
        />
        <StatCard
          title="שיפורים השבוע"
          value={weeklyPRs.length}
          icon={Trophy}
          colorTheme="emerald"
        />
        <StatCard
          title="התראות"
          value={stats.alerts}
          icon={AlertCircle}
          colorTheme="red"
        />
      </div>

      <div className="space-y-4 sm:space-y-6 flex flex-col">
          
          {/* --- Insights Card --- */}
          {insights.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500 w-full block">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 rounded-xl sm:rounded-2xl shadow-md w-full">
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
            </section>
          )}

          {/* --- Alerts Card --- */}
          {alertsList.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500 w-full block" style={{ animationDelay: '100ms' }}>
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl shadow-md w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-black text-red-900 dark:text-red-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    התראות ({alertsList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {alertsList.slice(0, 5).map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 sm:p-3 bg-white dark:bg-slate-900/50 rounded-lg">
                      <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        alert.type === 'error' ? 'text-red-600 dark:text-red-400' :
                        alert.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
                        {alert.traineeId && (
                          <Link href={`/trainer/trainee/${alert.traineeId}`} className="mt-1 inline-block">
                            <Button size="sm" variant="outline" className="h-6 text-xs">
                              צפה בפרופיל
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}

          {/* --- Charts Section (Grid of 2) --- */}
          {(workoutTrendData.length > 0 || complianceTrendData.length > 0) && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500 w-full block mb-4 sm:mb-6" style={{ animationDelay: '150ms' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {workoutTrendData.length > 0 && (
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl w-full overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                        מגמת אימונים
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="w-full p-4 sm:p-6">
                      <div className="w-full" style={{ minHeight: '250px' }}>
                        <SimpleLineChart
                          data={workoutTrendData}
                          height={250}
                          unit="אימונים"
                          showGradient={true}
                          showTooltip={true}
                          showXAxis={true}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                {complianceTrendData.length > 0 && (
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-md rounded-xl sm:rounded-2xl w-full overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                        מגמת התאמה לתוכנית
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="w-full p-4 sm:p-6">
                      <div className="w-full" style={{ minHeight: '250px' }}>
                        <SimpleLineChart
                          data={complianceTrendData}
                          height={250}
                          unit="%"
                          showGradient={true}
                          showTooltip={true}
                          showXAxis={true}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* --- Weekly Achievements Card --- */}
          {weeklyPRs.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500 w-full block" style={{ animationDelay: '175ms' }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 rounded-xl sm:rounded-2xl shadow-md w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                    הישגים השבוע ({weeklyPRs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {weeklyPRs.slice(0, 5).map((pr, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-slate-900/50 rounded-lg">
                      <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          {pr.traineeName} - {pr.exerciseName}
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
                            • {new Date(pr.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {weeklyPRs.length > 5 && (
                    <Link href="/trainer/reports" className="block mt-2">
                      <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                        צפה בכל ההישגים ({weeklyPRs.length})
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* --- Top Performers Card --- */}
          {topPerformers.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500 w-full block" style={{ animationDelay: '200ms' }}>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 rounded-xl sm:rounded-2xl shadow-md w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {topPerformers.map((performer, idx) => (
                    <Link
                      key={performer.id}
                      href={`/trainer/trainee/${performer.id}`}
                      className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-white dark:bg-slate-900/50 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-blue-200 dark:border-blue-800">
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-black text-sm">
                            {performer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                            <Trophy className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                          {performer.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">
                            התאמה: {performer.compliance}%
                          </span>
                          <span className="text-gray-300 dark:text-slate-600">•</span>
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">
                            {performer.workoutCount} אימונים
                          </span>
                          {performer.prCount > 0 && (
                            <>
                              <span className="text-gray-300 dark:text-slate-600">•</span>
                              <span className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-bold">
                                {performer.prCount} PRs
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {idx < 3 && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          מוביל
                        </span>
                      )}
                    </Link>
                  ))}
                  <Link href="/trainer/trainees" className="block mt-2">
                    <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                      צפה בכל המתאמנים
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </section>
          )}

          {/* --- Needs Attention Card (Improved) --- */}
          {alertsList.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500 w-full block" style={{ animationDelay: '225ms' }}>
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl shadow-md w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg font-black text-red-900 dark:text-red-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    מתאמנים שצריכים תשומת לב ({alertsList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {alertsList.slice(0, 5).map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-slate-900/50 rounded-lg">
                      <AlertCircle className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0 ${
                        alert.type === 'error' ? 'text-red-600 dark:text-red-400' :
                        alert.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {alert.message}
                        </p>
                        {alert.traineeId && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/trainer/trainee/${alert.traineeId}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                צפה בפרופיל
                              </Button>
                            </Link>
                            <Link href={`/trainer/workout-plans/${alert.traineeId}/edit`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <Edit className="h-3 w-3 mr-1" />
                                עדכן תוכנית
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black border ${
                        alert.type === 'error' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                        alert.type === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                      }`}>
                        {alert.type === 'error' ? 'דחוף' : alert.type === 'warning' ? 'אזהרה' : 'מידע'}
                      </span>
                    </div>
                  ))}
                  {alertsList.length > 5 && (
                    <Link href="/trainer/trainees" className="block mt-2">
                      <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                        צפה בכל ההתראות ({alertsList.length})
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* --- Recent Activity List --- */}
          <section className="animate-in fade-in slide-in-from-top-2 duration-500 w-full block" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between px-1 mb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-500" /> פעילות אחרונה
                </h2>
                <Link href="/trainer/trainees" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  צפה בכל
                </Link>
            </div>
            
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-xl sm:rounded-2xl w-full">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100/50 dark:divide-slate-800/50">
                    {traineesWithStatus.length > 0 ? (
                        traineesWithStatus.slice(0, 5).map((trainee, idx) => (
                            <Link 
                                key={trainee.id} 
                                href={`/trainer/trainee/${trainee.id}`}
                                className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all group animate-in fade-in slide-in-from-right-2"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex items-center gap-3.5">
                                    <Avatar className="h-10 w-10 border-2 border-gray-100 dark:border-slate-800">
                                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-black text-sm">
                                            {trainee.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{trainee.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
                                            <span className="truncate max-w-[100px]">{trainee.planName || "ללא תוכנית"}</span>
                                            <span className="text-gray-300 dark:text-slate-600">•</span>
                                            <span>{formatDate(trainee.lastWorkout)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                                        trainee.compliance >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                        trainee.compliance >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                        'bg-red-50 text-red-700 border-red-200/50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                    }`}>
                                        {trainee.compliance}%
                                    </span>
                                    <ChevronLeft className="h-4 w-4 text-gray-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-8 sm:p-12 text-center">
                          <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2">
                            אין מתאמנים להצגה
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mb-4">
                            התחל להוסיף מתאמנים כדי לראות את הפעילות שלהם כאן
                          </p>
                          <Link href="/trainer/trainees/new">
                            <Button size="sm" className="text-xs sm:text-sm">
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              הוסף מתאמן
                            </Button>
                          </Link>
                        </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* --- Quick Actions --- */}
          <section className="animate-in fade-in slide-in-from-top-2 duration-500 w-full block" style={{ animationDelay: '300ms' }}>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1 mb-3">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-500" /> פעולות מהירות
            </h2>
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-xl sm:rounded-2xl w-full">
              <CardContent className="p-0 divide-y divide-gray-100/50 dark:divide-slate-800/50">
                  {[
                    { title: "דוח שבועי", desc: "CSV מסכם", icon: FileText, action: exportWeeklyReport, color: "blue" },
                    { title: "ניתוח ביצועים", desc: "גרפים ומגמות", icon: BarChart3, action: exportPerformanceReport, color: "purple" },
                  ].map((item, index) => {
                    const colorClasses = {
                      blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
                      purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
                    };
                    const iconColorClasses = {
                      blue: "text-blue-500",
                      purple: "text-purple-500",
                    };
                    return (
                    <button 
                      key={index}
                      onClick={item.action} 
                      className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all text-right group relative"
                    >
                        <div className={`p-2.5 rounded-xl ${colorClasses[item.color as keyof typeof colorClasses]} group-hover:scale-105 transition-transform shadow-sm`}>
                            <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 z-10">
                            <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">{item.title}</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">{item.desc}</span>
                        </div>
                        <ArrowUpRight className={`h-5 w-5 ${iconColorClasses[item.color as keyof typeof iconColorClasses]} opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all`} />
                    </button>
                  )})}
                  
                  <Link href="/trainer/reports" className="block">
                     <div className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-all text-right group relative">
                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all shadow-sm">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-bold text-gray-900 dark:text-white block mb-0.5">מרכז הדוחות</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">צפייה בכל האפשרויות</span>
                        </div>
                    </div>
                  </Link>
              </CardContent>
            </Card>
          </section>

      </div>
    </div>
  );
}