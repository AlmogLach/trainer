"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, FileText, Download, Calendar, TrendingUp, TrendingDown,
  Users, BarChart3, Target, Activity, Award, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  getTrainerTrainees, 
  getTrainerStats, 
  getTraineesWithStatus, 
  getWorkoutLogsForUsers,
  getBodyWeightHistoryForUsers,
  getWorkoutLogs,
  getBodyWeightHistory
} from "@/lib/db";
import { calculateTraineeStats } from "@/lib/trainee-stats";
import { createCsvContent, downloadCsv, createCsvRow } from "@/lib/csv-export";
import type { User } from "@/lib/types";

interface TraineeReport {
  id: string;
  name: string;
  planName: string;
  status: 'active' | 'inactive';
  lastWorkout: string | null;
  compliance: number;
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  averageWeight: number | null;
  weightChange: number | null;
  totalVolume: number;
}

function ReportsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<TraineeReport[]>([]);
  const [stats, setStats] = useState({
    activeTrainees: 0,
    workoutsToday: { completed: 0, total: 0 },
    averageCompliance: 0,
    alerts: 0,
  });
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("month");

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadReports();
    }
  }, [trainerId, timeFilter]);

  const loadReports = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);

      // 1. Load trainer stats and trainees in parallel
      const [trainerStats, trainees] = await Promise.all([
        getTrainerStats(trainerId),
        getTrainerTrainees(trainerId),
      ]);

      setStats(trainerStats);

      if (trainees.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      const traineeIds = trainees.map(t => t.id);

      // 2. Calculate start date for filtering (server-side optimization)
      const now = new Date();
      let startDate: string | undefined;
      
      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      // 3. Load all data in parallel (optimized queries)
      const [logsMap, weightsMap, statusData] = await Promise.all([
        getWorkoutLogsForUsers(traineeIds, startDate),
        getBodyWeightHistoryForUsers(traineeIds),
        getTraineesWithStatus(trainerId),
      ]);

      // 4. Process data in memory (much faster than network requests)
      const reportsData: TraineeReport[] = trainees.map(trainee => {
        const logs = logsMap.get(trainee.id) || [];
        const weightHistory = weightsMap.get(trainee.id) || [];
        const traineeStatus = statusData.find(s => s.id === trainee.id);

        // Use shared calculation function
        const stats = calculateTraineeStats(logs, weightHistory, timeFilter);

        return {
          id: trainee.id,
          name: trainee.name,
          planName: traineeStatus?.planName || "אין תוכנית",
          status: traineeStatus?.status || 'inactive',
          lastWorkout: traineeStatus?.lastWorkout || null,
          compliance: traineeStatus?.compliance || 0,
          totalWorkouts: stats.totalWorkouts,
          workoutsThisWeek: stats.workoutsThisWeek,
          workoutsThisMonth: stats.workoutsThisMonth,
          averageWeight: stats.averageWeight,
          weightChange: stats.weightChange,
          totalVolume: stats.totalVolume,
        };
      });

      setReports(reportsData);
    } catch (error: any) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "אין";
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const exportReport = () => {
    const headers = [
      "שם",
      "תוכנית",
      "סטטוס",
      "אימונים (סה\"כ)",
      "אימונים (שבוע)",
      "אימונים (חודש)",
      "התאמה",
      "משקל ממוצע",
      "שינוי משקל",
      "נפח כולל"
    ];

    const rows = reports.map(r => [
      r.name,
      r.planName,
      r.status === 'active' ? 'פעיל' : 'לא פעיל',
      r.totalWorkouts,
      r.workoutsThisWeek,
      r.workoutsThisMonth,
      `${r.compliance}%`,
      r.averageWeight ? `${r.averageWeight.toFixed(1)} ק\"ג` : "אין",
      r.weightChange ? `${r.weightChange > 0 ? '+' : ''}${r.weightChange.toFixed(1)} ק\"ג` : "אין",
      `${r.totalVolume.toFixed(0)} ק\"ג`
    ]);

    const csvContent = createCsvContent(headers, rows);
    const filename = `דוחות_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(csvContent, filename);
  };

  const exportTraineeReport = async (report: TraineeReport) => {
    try {
      // Calculate start date for filtering
      const now = new Date();
      let startDate: string | undefined;
      
      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      // Load detailed data for this trainee (with server-side filtering)
      const [logs, weightHistory] = await Promise.all([
        getWorkoutLogs(report.id, undefined, startDate),
        getBodyWeightHistory(report.id),
      ]);

      const completedLogs = logs.filter(log => log.completed);

      // Create detailed CSV with safe escaping
      const headers = [
        "תאריך", "רוטינה", "תרגיל", "סט", "משקל (ק\"ג)", "חזרות", "RIR", "נפח (ק\"ג)", "הערות"
      ];

      const rows: (string | number | null | undefined)[][] = [];

      // Add summary section
      rows.push(["דוח מפורט - " + report.name]);
      rows.push(["תוכנית: " + report.planName]);
      rows.push(["סטטוס: " + (report.status === 'active' ? 'פעיל' : 'לא פעיל')]);
      rows.push(["אימונים (סה\"כ): " + report.totalWorkouts]);
      rows.push(["אימונים (שבוע): " + report.workoutsThisWeek]);
      rows.push(["אימונים (חודש): " + report.workoutsThisMonth]);
      rows.push(["התאמה: " + report.compliance + "%"]);
      rows.push(["משקל ממוצע: " + (report.averageWeight ? `${report.averageWeight.toFixed(1)} ק\"ג` : "אין")]);
      rows.push(["שינוי משקל: " + (report.weightChange ? `${report.weightChange > 0 ? '+' : ''}${report.weightChange.toFixed(1)} ק\"ג` : "אין")]);
      rows.push(["נפח כולל: " + `${report.totalVolume.toFixed(0)} ק\"ג`]);
      rows.push(["אימון אחרון: " + formatDate(report.lastWorkout)]);
      rows.push([]);
      rows.push(["פירוט אימונים:"]);
      rows.push(headers);

      // Add workout details
      completedLogs.forEach(log => {
        const routineName = log.routine ? `${log.routine.letter} - ${log.routine.name}` : 'ללא רוטינה';
        
        if (log.set_logs && log.set_logs.length > 0) {
          log.set_logs.forEach((setLog, index) => {
            const exerciseName = setLog.exercise?.name || 'תרגיל לא ידוע';
            const volume = (setLog.weight_kg || 0) * (setLog.reps || 0);
            
            rows.push([
              log.date,
              routineName,
              exerciseName,
              setLog.set_number || index + 1,
              setLog.weight_kg || 0,
              setLog.reps || 0,
              setLog.rir_actual !== null && setLog.rir_actual !== undefined ? setLog.rir_actual : '',
              volume.toFixed(1),
              setLog.notes || ''
            ]);
          });
        } else {
          // Log without sets
          rows.push([
            log.date,
            routineName,
            '',
            '',
            '',
            '',
            '',
            '',
            ''
          ]);
        }
      });

      // Add weight history section
      if (weightHistory.length > 0) {
        rows.push([]);
        rows.push(["היסטוריית משקל:"]);
        rows.push(["תאריך", "משקל (ק\"ג)"]);
        weightHistory.forEach(w => {
          rows.push([w.date, w.weight.toFixed(1)]);
        });
      }

      // Use safe CSV export
      const csvContent = rows.map(row => createCsvRow(row)).join("\n");
      const safeName = report.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `דוח_${safeName}_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsv(csvContent, filename);
    } catch (error: any) {
      console.error("Error exporting trainee report:", error);
      alert("שגיאה בייצוא הדוח: " + error.message);
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
            <p className="text-xl font-black text-foreground animate-pulse">טוען דוחות...</p>
            <p className="text-sm text-muted-foreground mt-1">מכין את הנתונים</p>
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
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header - Connected to top header */}
        <div className="bg-gradient-to-r from-card to-card/95 border-b-2 border-border rounded-b-xl sm:rounded-b-[2rem] px-4 lg:px-6 py-3 sm:py-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-primary font-bold text-[10px] sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-1">FitLog Reports 📊</p>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-foreground">דוחות וסטטיסטיקות</h1>
              <p className="text-muted-foreground text-[11px] sm:text-sm mt-1 sm:mt-2">סקירה כללית של ביצועי המתאמנים</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex gap-1.5 sm:gap-2 bg-card p-1 sm:p-1.5 rounded-lg sm:rounded-xl border-2 border-border shadow-md">
                <Button
                  size="sm"
                  variant={timeFilter === "week" ? "default" : "ghost"}
                  onClick={() => setTimeFilter("week")}
                  className={timeFilter === "week" 
                    ? "bg-primary text-background font-black rounded-lg text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3" 
                    : "text-muted-foreground font-bold hover:bg-accent rounded-lg text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3"}
                >
                  שבוע
                </Button>
                <Button
                  size="sm"
                  variant={timeFilter === "month" ? "default" : "ghost"}
                  onClick={() => setTimeFilter("month")}
                  className={timeFilter === "month" 
                    ? "bg-primary text-background font-black rounded-lg text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3" 
                    : "text-muted-foreground font-bold hover:bg-accent rounded-lg text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3"}
                >
                  חודש
                </Button>
                <Button
                  size="sm"
                  variant={timeFilter === "all" ? "default" : "ghost"}
                  onClick={() => setTimeFilter("all")}
                  className={timeFilter === "all" 
                    ? "bg-primary text-background font-black rounded-lg text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3" 
                    : "text-muted-foreground font-bold hover:bg-accent rounded-lg text-[10px] sm:text-sm h-7 sm:h-8 px-2 sm:px-3"}
                >
                  הכל
                </Button>
              </div>
              <Button
                onClick={exportReport}
                className="h-8 sm:h-11 px-3 sm:px-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-black rounded-lg sm:rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 text-xs sm:text-base"
              >
                <Download className="h-3 w-3 sm:h-5 sm:w-5 ml-1.5 sm:ml-2" />
                <span className="hidden sm:inline">ייצא ל-CSV</span>
                <span className="sm:hidden">ייצא</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content with padding */}
        <div className="px-2 sm:px-4 lg:px-6 py-3 sm:py-6 space-y-3 sm:space-y-6">
        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/20 shadow-lg rounded-lg sm:rounded-2xl hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '0ms' }}>
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">מתאמנים פעילים</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="flex items-center justify-between">
                <div className="text-xl sm:text-3xl lg:text-4xl font-black text-blue-500">{stats.activeTrainees}</div>
                <div className="bg-blue-500/20 p-1.5 sm:p-3 rounded-lg sm:rounded-2xl">
                  <Users className="h-4 w-4 sm:h-8 sm:w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 shadow-lg rounded-lg sm:rounded-2xl hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">אימונים היום</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl sm:text-3xl lg:text-4xl font-black text-primary">{stats.workoutsToday.completed}</div>
                  <div className="text-[10px] sm:text-sm text-muted-foreground font-medium">מתוך {stats.workoutsToday.total}</div>
                </div>
                <div className="bg-primary/20 p-1.5 sm:p-3 rounded-lg sm:rounded-2xl">
                  <Activity className="h-4 w-4 sm:h-8 sm:w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-2 border-purple-500/20 shadow-lg rounded-lg sm:rounded-2xl hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">התאמה ממוצעת</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="flex items-center justify-between">
                <div className="text-xl sm:text-3xl lg:text-4xl font-black text-purple-500">{stats.averageCompliance}%</div>
                <div className="bg-purple-500/20 p-1.5 sm:p-3 rounded-lg sm:rounded-2xl">
                  <Target className="h-4 w-4 sm:h-8 sm:w-8 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-2 border-orange-500/20 shadow-lg rounded-lg sm:rounded-2xl hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-1 sm:pb-3 p-2 sm:p-6">
              <CardTitle className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">התראות</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <div className="flex items-center justify-between">
                <div className="text-xl sm:text-3xl lg:text-4xl font-black text-orange-500">{stats.alerts}</div>
                <div className="bg-orange-500/20 p-1.5 sm:p-3 rounded-lg sm:rounded-2xl">
                  <AlertTriangle className="h-4 w-4 sm:h-8 sm:w-8 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Reports Table */}
        <Card className="bg-card border-2 border-border shadow-lg rounded-2xl sm:rounded-[2rem]">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-primary/20 p-1.5 sm:p-2.5 rounded-lg sm:rounded-2xl">
                  <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-2xl font-black text-foreground">דוחות מתאמנים</CardTitle>
              </div>
              {reports.length > 0 && (
                <div className="bg-primary/10 px-2 sm:px-3 py-1 rounded-lg border border-primary/30">
                  <span className="text-primary font-black text-xs sm:text-sm">{reports.length}</span>
                  <span className="text-muted-foreground text-xs mr-1">מתאמנים</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-2 p-2 sm:p-3">
              {reports.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-accent/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block">
                      <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto" />
                    </div>
                    <p className="text-foreground font-black text-base sm:text-lg">אין נתונים להצגה</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">לא נמצאו דוחות לתקופה הנבחרת</p>
                  </div>
                </div>
              ) : (
                reports.map((report, index) => (
                  <Card key={report.id} className="bg-gradient-to-br from-card to-accent/10 border-2 border-border rounded-lg sm:rounded-xl p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm sm:text-base font-black text-foreground truncate flex-1 mr-2">{report.name}</h3>
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-black flex-shrink-0 ${
                        report.status === 'active' 
                          ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                      }`}>
                        {report.status === 'active' ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">{report.planName}</div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                      <div>
                        <span className="text-muted-foreground">אימונים (סה"כ): </span>
                        <span className="font-bold text-foreground">{report.totalWorkouts}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">אימונים (שבוע): </span>
                        <span className="font-bold text-foreground">{report.workoutsThisWeek}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">אימונים (חודש): </span>
                        <span className="font-bold text-foreground">{report.workoutsThisMonth}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">התאמה: </span>
                        <span className="font-bold text-foreground">{report.compliance}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">משקל ממוצע: </span>
                        <span className="font-bold text-foreground">
                          {report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : "אין"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">נפח כולל: </span>
                        <span className="font-bold text-foreground">
                          {report.totalVolume > 0 ? `${report.totalVolume.toFixed(0)} ק"ג` : "אין"}
                        </span>
                      </div>
                    </div>
                    {report.weightChange !== null && (
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <span className="text-muted-foreground">שינוי משקל: </span>
                        {report.weightChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        ) : report.weightChange < 0 ? (
                          <TrendingDown className="h-3 w-3 text-green-500" />
                        ) : null}
                        <span className={`font-bold ${report.weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {report.weightChange > 0 ? '+' : ''}{report.weightChange.toFixed(1)} ק"ג
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] sm:text-xs text-muted-foreground">
                      אימון אחרון: {formatDate(report.lastWorkout)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportTraineeReport(report)}
                      className="w-full border-2 border-border text-foreground hover:bg-accent font-bold rounded-lg transition-all active:scale-95 text-[11px] sm:text-xs h-7 sm:h-8"
                    >
                      <Download className="h-3 w-3 ml-1.5 sm:ml-2" />
                      ייצא דוח
                    </Button>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border-2 border-border">
              <div className="min-w-[800px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border bg-accent/30">
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">שם</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">תוכנית</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">סטטוס</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">אימונים (סה"כ)</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">אימונים (שבוע)</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">אימונים (חודש)</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">התאמה</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">משקל ממוצע</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">שינוי משקל</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">נפח כולל</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">אימון אחרון</th>
                      <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-black text-foreground uppercase tracking-wider whitespace-nowrap">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-16">
                          <div className="space-y-4">
                            <div className="bg-accent/30 p-8 rounded-3xl inline-block">
                              <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                            </div>
                            <p className="text-foreground font-black text-xl">אין נתונים להצגה</p>
                            <p className="text-muted-foreground">לא נמצאו דוחות לתקופה הנבחרת</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reports.map((report, index) => (
                        <tr key={report.id} className="border-b border-border hover:bg-accent/30 transition-all animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: `${index * 30}ms` }}>
                          <td className="p-2 sm:p-4 text-foreground font-black text-sm sm:text-base">{report.name}</td>
                          <td className="p-2 sm:p-4 text-muted-foreground font-medium text-xs sm:text-sm">{report.planName}</td>
                          <td className="p-2 sm:p-4">
                            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-black ${
                              report.status === 'active' 
                                ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                                : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                            }`}>
                              {report.status === 'active' ? 'פעיל' : 'לא פעיל'}
                            </span>
                          </td>
                          <td className="p-2 sm:p-4 text-foreground font-bold text-sm sm:text-base">{report.totalWorkouts}</td>
                          <td className="p-2 sm:p-4 text-foreground font-bold text-sm sm:text-base">{report.workoutsThisWeek}</td>
                          <td className="p-2 sm:p-4 text-foreground font-bold text-sm sm:text-base">{report.workoutsThisMonth}</td>
                          <td className="p-2 sm:p-4">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="flex-1 bg-accent rounded-full h-2 sm:h-2.5 max-w-[50px] sm:max-w-[70px]">
                                <div 
                                  className={`h-2 sm:h-2.5 rounded-full transition-all ${
                                    report.compliance >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                    report.compliance >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                    'bg-gradient-to-r from-red-500 to-red-400'
                                  }`}
                                  style={{ width: `${Math.min(100, report.compliance)}%` }}
                                />
                              </div>
                              <span className="text-foreground text-xs sm:text-sm font-black">{report.compliance}%</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 text-muted-foreground font-medium text-xs sm:text-sm">
                            {report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : "אין"}
                          </td>
                          <td className="p-2 sm:p-4">
                            {report.weightChange !== null ? (
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                {report.weightChange > 0 ? (
                                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                ) : report.weightChange < 0 ? (
                                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                ) : null}
                                <span className={`font-bold text-xs sm:text-sm ${report.weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                  {report.weightChange > 0 ? '+' : ''}{report.weightChange.toFixed(1)} ק"ג
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs sm:text-sm">אין</span>
                            )}
                          </td>
                          <td className="p-2 sm:p-4 text-muted-foreground font-medium text-xs sm:text-sm">
                            {report.totalVolume > 0 ? `${report.totalVolume.toFixed(0)} ק"ג` : "אין"}
                          </td>
                          <td className="p-2 sm:p-4 text-muted-foreground font-medium text-xs sm:text-sm">{formatDate(report.lastWorkout)}</td>
                          <td className="p-2 sm:p-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportTraineeReport(report)}
                              className="border-2 border-border text-foreground hover:bg-accent font-bold rounded-lg transition-all active:scale-95 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                            >
                              <Download className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                              <span className="hidden sm:inline">ייצא דוח</span>
                              <span className="sm:hidden">ייצא</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ReportsContent />
    </ProtectedRoute>
  );
}

