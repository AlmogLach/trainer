"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, Loader2, Search, MoreHorizontal, Edit, Trash2, UserPlus,
  Users, Activity, TrendingUp, AlertCircle, Trophy, Filter, ArrowUpDown,
  Eye, Calendar, Mail, Dumbbell, X
} from "lucide-react";
import { getTrainerTraineesWithDetails, getTraineesWithStatus, getWorkoutLogsForUsers, getTrainerTrainees } from "@/lib/db";
import { createTraineeAccount } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTraineeForm, CredentialsDisplay } from "@/components/trainer/AddTraineeForm";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

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

function SkeletonTraineeCard() {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-xl sm:rounded-2xl">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
            <Skeleton className="h-4 w-24 sm:w-32" />
            <Skeleton className="h-4 w-28 sm:w-36" />
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

type PlanFilter = 'all' | 'active' | 'inactive';
type ComplianceFilter = 'all' | 'high' | 'medium' | 'low';
type SortBy = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'compliance-desc' | 'compliance-asc' | 'workouts-desc' | 'workouts-asc' | 'lastWorkout-desc' | 'lastWorkout-asc';

function TraineesManagementContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [trainees, setTrainees] = useState<Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    planActive: boolean;
    planName: string | null;
    lastWorkout: string | null;
  }>>([]);
  const [traineesWithStatus, setTraineesWithStatus] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [newTraineeCredentials, setNewTraineeCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name-asc');

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadTrainees();
    }
  }, [trainerId]);

  const loadTrainees = async () => {
    if (!trainerId) return;
    try {
      setLoading(true);
      setError(null);
      
      // Load all data in parallel
      const [traineesWithDetails, statusData, traineesList] = await Promise.all([
        getTrainerTraineesWithDetails(trainerId),
        getTraineesWithStatus(trainerId),
        getTrainerTrainees(trainerId),
      ]);
      
      setTrainees(traineesWithDetails);
      setTraineesWithStatus(statusData);
      
      // Load workout logs for all trainees
      const traineeIds = traineesList.map(t => t.id);
      if (traineeIds.length > 0) {
        const logsData = await getWorkoutLogsForUsers(traineeIds, undefined);
        const logsArray = logsData instanceof Map 
          ? Array.from(logsData.values()).flat()
          : Array.isArray(logsData) ? logsData : [];
        setWorkoutLogs(logsArray);
      }
    } catch (err: any) {
      console.error("Error loading trainees:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
      showToast('שגיאה בטעינת הנתונים', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainee = async (email: string, password: string, name: string) => {
    if (!name || !email || !password) {
      setError("אנא מלא את כל השדות");
      showToast('אנא מלא את כל השדות', 'error');
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      showToast('הסיסמה חייבת להכיל לפחות 6 תווים', 'error');
      return;
    }
    try {
      setAdding(true);
      setError(null);
      await createTraineeAccount(email, password, name);
      setNewTraineeCredentials({ email, password });
      setIsAddDialogOpen(false);
      showToast('מתאמן נוסף בהצלחה!', 'success');
      await loadTrainees();
    } catch (err: any) {
      console.error("Error adding trainee:", err);
      setError(err.message || "שגיאה בהוספת מתאמן");
      showToast(err.message || 'שגיאה בהוספת מתאמן', 'error');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("he-IL", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Calculate quick stats
  const quickStats = useMemo(() => {
    const total = trainees.length;
    const active = trainees.filter(t => t.planActive).length;
    const avgCompliance = traineesWithStatus.length > 0
      ? Math.round(traineesWithStatus.reduce((sum, t) => sum + t.compliance, 0) / traineesWithStatus.length)
      : 0;
    
    // Calculate workouts this week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const workoutsThisWeek = workoutLogs.filter((log: any) => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && log.completed;
    }).length;
    
    // Calculate PRs this week (simplified)
    const prsThisWeek = 0; // TODO: Calculate from workout logs
    
    // Calculate needs attention (low compliance or no workouts)
    const needsAttention = traineesWithStatus.filter(t => 
      t.compliance < 50 || !t.lastWorkout
    ).length;
    
    return {
      total,
      active,
      avgCompliance,
      workoutsThisWeek,
      prsThisWeek,
      needsAttention,
    };
  }, [trainees, traineesWithStatus, workoutLogs]);

  // Calculate trainees with additional stats
  const traineesWithStats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    return trainees.map(trainee => {
      const status = traineesWithStatus.find(ts => ts.id === trainee.id);
      const workoutsThisWeek = workoutLogs.filter((log: any) => {
        if (log.user_id !== trainee.id || !log.completed) return false;
        const logDate = new Date(log.date);
        return logDate >= weekStart;
      }).length;
      
      const prsThisWeek = 0; // TODO: Calculate from workout logs
      
      return {
        ...trainee,
        compliance: status?.compliance || 0,
        workoutsThisWeek,
        prsThisWeek,
      };
    });
  }, [trainees, traineesWithStatus, workoutLogs]);

  // Filter and sort trainees
  const filteredAndSortedTrainees = useMemo(() => {
    let filtered = traineesWithStats.filter(trainee => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        trainee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Plan filter
      const matchesPlan = planFilter === 'all' ||
        (planFilter === 'active' && trainee.planActive) ||
        (planFilter === 'inactive' && !trainee.planActive);
      
      // Compliance filter
      const matchesCompliance = complianceFilter === 'all' ||
        (complianceFilter === 'high' && trainee.compliance >= 80) ||
        (complianceFilter === 'medium' && trainee.compliance >= 50 && trainee.compliance < 80) ||
        (complianceFilter === 'low' && trainee.compliance < 50);
      
      return matchesSearch && matchesPlan && matchesCompliance;
    });
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'compliance-desc':
          return (b.compliance || 0) - (a.compliance || 0);
        case 'compliance-asc':
          return (a.compliance || 0) - (b.compliance || 0);
        case 'workouts-desc':
          return b.workoutsThisWeek - a.workoutsThisWeek;
        case 'workouts-asc':
          return a.workoutsThisWeek - b.workoutsThisWeek;
        case 'lastWorkout-desc':
          if (!a.lastWorkout && !b.lastWorkout) return 0;
          if (!a.lastWorkout) return 1;
          if (!b.lastWorkout) return -1;
          return new Date(b.lastWorkout).getTime() - new Date(a.lastWorkout).getTime();
        case 'lastWorkout-asc':
          if (!a.lastWorkout && !b.lastWorkout) return 0;
          if (!a.lastWorkout) return 1;
          if (!b.lastWorkout) return -1;
          return new Date(a.lastWorkout).getTime() - new Date(b.lastWorkout).getTime();
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [traineesWithStats, searchQuery, planFilter, complianceFilter, sortBy]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-32" dir="rtl">
      
      {/* --- Page Header & Actions --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">ניהול מתאמנים</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 mt-1">צפייה, עריכה והוספה של מתאמנים</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-slate-400" />
                <Input 
                    placeholder="חיפוש מתאמן..." 
                    className="pr-10 bg-white dark:bg-slate-900/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="gap-2 shadow-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-none w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">הוסף מתאמן</span>
                        <span className="sm:hidden">הוסף</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>הוספת מתאמן חדש</DialogTitle>
                        <DialogDescription>
                            מלא את הפרטים ליצירת חשבון למתאמן.
                        </DialogDescription>
                    </DialogHeader>
                    <AddTraineeForm
                        onAdd={handleAddTrainee}
                        onCancel={() => {
                            setIsAddDialogOpen(false);
                            setError(null);
                        }}
                        adding={adding}
                        error={error}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* --- Quick Stats --- */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="סה״כ מתאמנים"
            value={quickStats.total}
            icon={Users}
            colorTheme="blue"
          />
          <StatCard
            title="פעילים"
            value={quickStats.active}
            subValue={`/ ${quickStats.total}`}
            icon={Activity}
            colorTheme="emerald"
          />
          <StatCard
            title="התאמה ממוצעת"
            value={`${quickStats.avgCompliance}%`}
            icon={TrendingUp}
            colorTheme="indigo"
          />
          <StatCard
            title="אימונים השבוע"
            value={quickStats.workoutsThisWeek}
            icon={Dumbbell}
            colorTheme="blue"
          />
          <StatCard
            title="PRs השבוע"
            value={quickStats.prsThisWeek}
            icon={Trophy}
            colorTheme="emerald"
          />
          <StatCard
            title="צריכים תשומת לב"
            value={quickStats.needsAttention}
            icon={AlertCircle}
            colorTheme="red"
          />
        </div>
      )}

      {/* --- Filters & Sort --- */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {planFilter === 'all' ? 'סטטוס תוכנית' : planFilter === 'active' ? 'עם תוכנית' : 'ללא תוכנית'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setPlanFilter('all')}>
              כל המתאמנים
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlanFilter('active')}>
              עם תוכנית
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlanFilter('inactive')}>
              ללא תוכנית
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              {complianceFilter === 'all' ? 'התאמה לתוכנית' : complianceFilter === 'high' ? 'התאמה גבוהה' : complianceFilter === 'medium' ? 'התאמה בינונית' : 'התאמה נמוכה'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setComplianceFilter('all')}>
              כל המתאמנים
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setComplianceFilter('high')}>
              התאמה גבוהה (≥80%)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setComplianceFilter('medium')}>
              התאמה בינונית (50-79%)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setComplianceFilter('low')}>
              התאמה נמוכה (&lt;50%)
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
            <DropdownMenuItem onClick={() => setSortBy('name-asc')}>
              שם (א-ב)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('name-desc')}>
              שם (ב-א)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('date-desc')}>
              תאריך הצטרפות (חדש לישן)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('date-asc')}>
              תאריך הצטרפות (ישן לחדש)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('compliance-desc')}>
              התאמה (גבוהה לנמוכה)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('compliance-asc')}>
              התאמה (נמוכה לגבוהה)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('workouts-desc')}>
              אימונים השבוע (הרבה למעט)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('workouts-asc')}>
              אימונים השבוע (מעט להרבה)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('lastWorkout-desc')}>
              אימון אחרון (חדש לישן)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('lastWorkout-asc')}>
              אימון אחרון (ישן לחדש)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {(searchQuery || planFilter !== 'all' || complianceFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setPlanFilter('all');
              setComplianceFilter('all');
            }}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            נקה פילטרים
          </Button>
        )}
      </div>

      {/* --- Trainees Grid --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonTraineeCard key={i} />
          ))}
        </div>
      ) : filteredAndSortedTrainees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAndSortedTrainees.map((trainee) => (
            <Card key={trainee.id} className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-xl sm:rounded-2xl hover:shadow-md transition-all group">
              <CardContent className="p-4 sm:p-5">
                {/* Header with Avatar and Name */}
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                  <Link href={`/trainer/trainee/${trainee.id}`} className="flex-shrink-0">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-gray-200 dark:border-slate-700 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors">
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-black text-lg sm:text-2xl">
                        {trainee.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/trainer/trainee/${trainee.id}`} className="block">
                      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {trainee.name}
                      </h3>
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 truncate mt-1">
                      {trainee.email}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                  {/* Compliance */}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <TrendingUp className={`h-4 w-4 flex-shrink-0 ${
                      trainee.compliance >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                      trainee.compliance >= 50 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">התאמה</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                        {trainee.compliance}%
                      </p>
                    </div>
                  </div>

                  {/* Workouts This Week */}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <Dumbbell className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">אימונים השבוע</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        {trainee.workoutsThisWeek}
                      </p>
                    </div>
                  </div>

                  {/* Plan Status */}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg col-span-2">
                    {trainee.planActive ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">תוכנית</p>
                          <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                            {trainee.planName || 'פעילה'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">תוכנית</p>
                          <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-slate-400">
                            ללא תוכנית
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Last Workout */}
                  {trainee.lastWorkout && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg col-span-2">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">אימון אחרון</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                          {formatDate(trainee.lastWorkout)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-800">
                  <Link href={`/trainer/trainee/${trainee.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                      פרופיל
                    </Button>
                  </Link>
                  {trainee.planActive && (
                    <Link href={`/trainer/workout-plans/${trainee.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                        תוכנית
                      </Button>
                    </Link>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => showToast('עריכה תתווסף בהמשך', 'info')}>
                        <Edit className="h-4 w-4 mr-2" />
                        ערוך פרטים
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => showToast('מחיקה תתווסף בהמשך', 'info')} className="text-red-600 dark:text-red-400">
                        <Trash2 className="h-4 w-4 mr-2" />
                        מחק מתאמן
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-xl sm:rounded-2xl">
          <CardContent className="p-12 sm:p-16 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
              <UserPlus className="h-12 w-12 sm:h-16 sm:w-16" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {searchQuery || planFilter !== 'all' || complianceFilter !== 'all' ? 'לא נמצאו תוצאות' : 'עדיין אין מתאמנים'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
                {searchQuery || planFilter !== 'all' || complianceFilter !== 'all' 
                  ? 'נסה לשנות את החיפוש או הפילטרים' 
                  : 'התחל להוסיף מתאמנים כדי לנהל אותם כאן'}
              </p>
            </div>
            {searchQuery || planFilter !== 'all' || complianceFilter !== 'all' ? (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setPlanFilter('all');
                  setComplianceFilter('all');
                }}
                variant="outline"
                className="mt-2 gap-2"
              >
                <X className="h-4 w-4" />
                נקה חיפוש
              </Button>
            ) : (
              <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="mt-2 gap-2">
                <Plus className="h-4 w-4" />
                הוסף מתאמן ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- Credentials Display Dialog --- */}
      {newTraineeCredentials && (
        <Dialog open={!!newTraineeCredentials} onOpenChange={(open) => !open && setNewTraineeCredentials(null)}>
             <DialogContent dir="rtl">
                <CredentialsDisplay
                    email={newTraineeCredentials.email}
                    password={newTraineeCredentials.password}
                    onClose={() => setNewTraineeCredentials(null)}
                />
             </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

export default function TraineesManagementPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TraineesManagementContent />
    </ProtectedRoute>
  );
}