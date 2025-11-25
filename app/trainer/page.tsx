"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, FileText,
  Users, Calendar, TrendingUp, AlertTriangle,
  BarChart3, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { getTrainerStats, getTraineesWithStatus, getTrainerTrainees, getWorkoutLogs, getBodyWeightHistory } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { User as UserType } from "@/lib/types";

function TrainerDashboardContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    activeTrainees: 0,
    workoutsToday: { completed: 0, total: 0 },
    averageCompliance: 0,
    alerts: 0,
  });
  const [traineesWithStatus, setTraineesWithStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId && !authLoading) {
      loadDashboardData();
    } else if (!authLoading && !trainerId) {
      setLoading(false);
    }
  }, [trainerId, authLoading]);

  const loadDashboardData = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);
      setError(null);

      // Load data in parallel - getTraineesWithStatus already includes all trainee data
      // No need to call getTrainerTrainees separately (it's called inside getTraineesWithStatus)
      const [statsData, statusData] = await Promise.all([
        getTrainerStats(trainerId),
        getTraineesWithStatus(trainerId),
      ]);

      setStats(statsData);
      setTraineesWithStatus(statusData);
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
          </div>
          <div>
            <p className="text-xl font-black text-foreground animate-pulse">טוען משתמש...</p>
            <p className="text-sm text-muted-foreground mt-1">מאמת הרשאות</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-6 max-w-md">
          <div className="bg-primary/10 p-6 rounded-3xl border-2 border-primary/30 inline-block">
            <Users className="h-16 w-16 text-primary mx-auto" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-foreground">נדרש התחברות</h1>
            <p className="text-muted-foreground text-base">יש להתחבר כדי לגשת לדף המאמן</p>
          </div>
          <Link href="/auth/login">
            <Button className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
              התחברות
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "אין";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `היום, ${date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `אתמול, ${date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("he-IL");
  };

  const exportWeeklyReport = async () => {
    try {
      if (!trainerId) return;

      // Use already loaded traineesWithStatus instead of fetching again
      const trainees = traineesWithStatus.length > 0 
        ? traineesWithStatus 
        : await getTraineesWithStatus(trainerId);
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const headers = ["שם", "תוכנית", "אימונים השבוע", "התאמה", "משקל ממוצע", "שינוי משקל", "נפח כולל", "אימון אחרון"];
      const rows: string[][] = [];

      // Load all data in parallel for all trainees (batch loading)
      const traineeIds = trainees.map(t => t.id);
      const [allLogs, allWeights] = await Promise.all([
        Promise.all(traineeIds.map(id => getWorkoutLogs(id))),
        Promise.all(traineeIds.map(id => getBodyWeightHistory(id)))
      ]);

      // Process each trainee using pre-loaded data
      for (let i = 0; i < trainees.length; i++) {
        const trainee = trainees[i];
        const logs = allLogs[i];
        const weightHistory = allWeights[i];
        
        const weekLogs = logs.filter(log => 
          new Date(log.date) >= weekAgo && log.completed
        );

        let averageWeight: number | null = null;
        let weightChange: number | null = null;
        
        if (weightHistory.length > 0) {
          const recentWeights = weightHistory.slice(0, 7);
          const sum = recentWeights.reduce((acc, w) => acc + w.weight, 0);
          averageWeight = sum / recentWeights.length;

          if (weightHistory.length >= 2) {
            const latest = weightHistory[0].weight;
            const previous = weightHistory[weightHistory.length - 1].weight;
            weightChange = latest - previous;
          }
        }

        let totalVolume = 0;
        weekLogs.forEach(log => {
          log.set_logs?.forEach(setLog => {
            if (setLog.weight_kg && setLog.reps) {
              totalVolume += setLog.weight_kg * setLog.reps;
            }
          });
        });

        rows.push([
          trainee.name,
          trainee.planName || "אין תוכנית",
          weekLogs.length.toString(),
          `${trainee.compliance || 0}%`,
          averageWeight ? `${averageWeight.toFixed(1)} ק"ג` : "אין",
          weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} ק"ג` : "אין",
          `${totalVolume.toFixed(0)} ק"ג`,
          trainee.lastWorkout ? new Date(trainee.lastWorkout).toLocaleDateString("he-IL") : "אין"
        ]);
      }

      const csvContent = [
        "דוח שבועי - " + new Date().toLocaleDateString("he-IL"),
        "",
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `דוח_שבועי_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error exporting weekly report:", error);
      alert("שגיאה בייצוא הדוח: " + error.message);
    }
  };

  const exportPerformanceReport = async () => {
    try {
      if (!trainerId) return;

      // Use already loaded data instead of fetching again
      const trainees = traineesWithStatus.length > 0 
        ? traineesWithStatus 
        : await getTraineesWithStatus(trainerId);
      const currentStats = stats.activeTrainees > 0 ? stats : await getTrainerStats(trainerId);

      const headers = ["שם", "סטטוס", "אימונים (סה\"כ)", "אימונים (שבוע)", "אימונים (חודש)", "התאמה", "משקל ממוצע", "נפח כולל"];
      const rows: string[][] = [];

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Load all data in parallel for all trainees (batch loading)
      const traineeIds = trainees.map(t => t.id);
      const [allLogs, allWeights] = await Promise.all([
        Promise.all(traineeIds.map(id => getWorkoutLogs(id))),
        Promise.all(traineeIds.map(id => getBodyWeightHistory(id)))
      ]);

      // Process each trainee using pre-loaded data
      for (let i = 0; i < trainees.length; i++) {
        const trainee = trainees[i];
        const logs = allLogs[i];
        const weightHistory = allWeights[i];
        
        const completedLogs = logs.filter(log => log.completed);
        const weekLogs = completedLogs.filter(log => new Date(log.date) >= weekAgo);
        const monthLogs = completedLogs.filter(log => new Date(log.date) >= monthAgo);

        let averageWeight: number | null = null;
        
        if (weightHistory.length > 0) {
          const recentWeights = weightHistory.slice(0, 7);
          const sum = recentWeights.reduce((acc, w) => acc + w.weight, 0);
          averageWeight = sum / recentWeights.length;
        }

        let totalVolume = 0;
        completedLogs.forEach(log => {
          log.set_logs?.forEach(setLog => {
            if (setLog.weight_kg && setLog.reps) {
              totalVolume += setLog.weight_kg * setLog.reps;
            }
          });
        });

        rows.push([
          trainee.name,
          trainee.status === 'active' ? 'פעיל' : 'לא פעיל',
          completedLogs.length.toString(),
          weekLogs.length.toString(),
          monthLogs.length.toString(),
          `${trainee.compliance || 0}%`,
          averageWeight ? `${averageWeight.toFixed(1)} ק"ג` : "אין",
          `${totalVolume.toFixed(0)} ק"ג`
        ]);
      }

      const csvContent = [
        "דוח ביצועים - " + new Date().toLocaleDateString("he-IL"),
        `מתאמנים פעילים: ${currentStats.activeTrainees}`,
        `אימונים היום: ${currentStats.workoutsToday.completed}/${currentStats.workoutsToday.total}`,
        `התאמה ממוצעת: ${currentStats.averageCompliance}%`,
        "",
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `דוח_ביצועים_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error exporting performance report:", error);
      alert("שגיאה בייצוא הדוח: " + error.message);
    }
  };


  return (
    <main className="max-w-7xl mx-auto">
          {/* Enhanced Header - Connected to top header */}
          <div className="bg-gradient-to-r from-card to-card/95 border-b-2 border-border rounded-b-2xl sm:rounded-b-[2rem] px-4 lg:px-6 py-4 sm:py-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="relative z-10">
              <p className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider mb-1">FitLog Trainer 💪</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">דשבורד מאמן</h2>
              <p className="text-muted-foreground text-xs sm:text-sm mt-2">ניהול ומעקב אחר כל המתאמנים שלך</p>
            </div>
          </div>

          {/* Content with padding */}
          <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-card to-accent/10 border-border shadow-lg rounded-xl sm:rounded-[1.5rem] overflow-hidden relative group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground font-bold uppercase">מתאמנים פעילים</p>
                    <div className="bg-primary/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">{stats.activeTrainees}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-accent/10 border-border shadow-lg rounded-xl sm:rounded-[1.5rem] overflow-hidden relative group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground font-bold uppercase">אימונים היום</p>
                    <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">
                    {stats.workoutsToday.completed}<span className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">/{stats.workoutsToday.total}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-accent/10 border-border shadow-lg rounded-xl sm:rounded-[1.5rem] overflow-hidden relative group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl" />
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground font-bold uppercase">ציות ממוצע</p>
                    <div className="bg-green-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-green-500">{stats.averageCompliance}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-accent/10 border-border shadow-lg rounded-xl sm:rounded-[1.5rem] overflow-hidden relative group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl" />
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex flex-col gap-2 sm:gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground font-bold uppercase">התראות</p>
                    <div className="bg-red-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-red-500">{stats.alerts}</p>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Command Center */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-card border-border shadow-lg rounded-2xl sm:rounded-[2rem] flex flex-col">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-primary/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <CardTitle className="text-foreground text-lg sm:text-xl font-black">פעילות אחרונה</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 flex-1 p-4 sm:p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground font-medium">טוען מתאמנים...</p>
                    </div>
                  </div>
                ) : traineesWithStatus.length > 0 ? (
                  <div className="space-y-3">
                    {traineesWithStatus.slice(0, 3).map((trainee, index) => (
                      <Link 
                        href={`/trainer/trainee/${trainee.id}`} 
                        key={trainee.id}
                        className="block bg-gradient-to-r from-accent/30 to-accent/20 rounded-2xl p-4 border-2 border-border hover:border-primary/30 hover:from-accent/40 hover:to-accent/30 transition-all active:scale-98 animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary font-black text-sm border-2 border-primary/30">
                              {trainee.name.charAt(0)}
                            </div>
                            <p className="font-black text-foreground text-base">{trainee.name}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm text-foreground font-bold">{trainee.planName}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                              אימון אחרון: {formatDate(trainee.lastWorkout)}
                            </p>
                          </div>
                          <div className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 ${
                            trainee.compliance >= 90 
                              ? 'bg-green-500/10 text-green-500 border-green-500/30' 
                              : trainee.compliance >= 70
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                              : 'bg-red-500/10 text-red-500 border-red-500/30'
                          }`}>
                            {trainee.compliance}%
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link href="/trainer/trainees" className="block">
                      <Button className="w-full mt-2 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 font-black rounded-xl h-10 transition-all active:scale-95">
                        צפה בכל המתאמנים
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-4">
                    <div className="bg-accent/30 p-6 rounded-3xl">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                    </div>
                    <p className="text-muted-foreground font-medium">אין מתאמנים פעילים</p>
                    <Link href="/trainer/trainees">
                      <Button className="h-10 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                        הוסף מתאמן חדש
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-lg rounded-2xl sm:rounded-[2rem]">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-foreground text-lg sm:text-xl font-black">דוחות מהירים</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6">
                <Button 
                  onClick={exportWeeklyReport}
                  className="w-full bg-gradient-to-r from-accent/40 to-accent/30 hover:from-accent/50 hover:to-accent/40 text-foreground border-2 border-border justify-start h-auto py-4 sm:py-5 group rounded-xl sm:rounded-2xl transition-all active:scale-98"
                >
                  <div className="bg-primary/20 p-2 sm:p-3 rounded-lg sm:rounded-xl ml-2 sm:ml-3 group-hover:bg-primary/30 transition-colors">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-black text-sm sm:text-base">דו"ח שבועי</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">ייצא דוח שבועי של כל המתאמנים</p>
                  </div>
                </Button>
                <Button 
                  onClick={exportPerformanceReport}
                  className="w-full bg-gradient-to-r from-accent/40 to-accent/30 hover:from-accent/50 hover:to-accent/40 text-foreground border-2 border-border justify-start h-auto py-4 sm:py-5 group rounded-xl sm:rounded-2xl transition-all active:scale-98"
                >
                  <div className="bg-blue-500/20 p-2 sm:p-3 rounded-lg sm:rounded-xl ml-2 sm:ml-3 group-hover:bg-blue-500/30 transition-colors">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-black text-sm sm:text-base">ביצועים</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">ייצא דוח ביצועים מפורט</p>
                  </div>
                </Button>
                <Link href="/trainer/reports" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-500/10 to-purple-500/5 hover:from-purple-500/20 hover:to-purple-500/10 text-foreground border-2 border-purple-500/30 justify-start h-auto py-4 sm:py-5 group rounded-xl sm:rounded-2xl transition-all active:scale-98">
                    <div className="bg-purple-500/20 p-2 sm:p-3 rounded-lg sm:rounded-xl ml-2 sm:ml-3 group-hover:bg-purple-500/30 transition-colors">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-black text-sm sm:text-base">דוחות מפורטים</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">עבור לדף הדוחות המלא</p>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

            {/* Workout Status Table - Only visible on larger screens */}
            <Card className="bg-card border-border shadow-sm hidden lg:block">
            <CardHeader>
              <CardTitle className="text-foreground">סטטוס אימונים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">שם</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">תוכנית</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">סטטוס</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">אימון אחרון</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">ציות</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </td>
                      </tr>
                    ) : traineesWithStatus.length > 0 ? (
                      traineesWithStatus.map((trainee) => (
                        <tr key={trainee.id} className="border-b border-border hover:bg-accent/30 transition-colors group">
                          <td className="py-3 px-4 font-medium text-foreground">{trainee.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{trainee.planName}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              trainee.status === 'active' 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : 'bg-destructive/10 text-destructive border border-destructive/20'
                            }`}>
                              {trainee.status === 'active' ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{formatDate(trainee.lastWorkout)}</td>
                          <td className="py-3 px-4">
                            <div className="w-full bg-secondary rounded-full h-2 max-w-[100px]">
                              <div 
                                className={`h-2 rounded-full ${
                                  trainee.compliance >= 90 ? 'bg-green-500' : 
                                  trainee.compliance >= 70 ? 'bg-yellow-500' : 'bg-destructive'
                                }`} 
                                style={{ width: `${trainee.compliance}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground mt-1 block">{trainee.compliance}%</span>
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/trainer/trainee/${trainee.id}`}>
                              <Button size="sm" variant="ghost" className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                פרטים
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          אין נתונים
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          </div>
    </main>
  );
}

export default function TrainerDashboard() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerDashboardContent />
    </ProtectedRoute>
  );
}
