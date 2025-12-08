"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, FileText, Download, Calendar, TrendingUp, TrendingDown,
  Users, BarChart3, Target, Activity, Award, AlertTriangle, Upload
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
  getBodyWeightHistory,
  getDailyNutritionLogsForUsers
} from "@/lib/db";
import { calculateTraineeStats } from "@/lib/trainee-stats";
import { calculatePRs, calculateNutritionStats } from "@/lib/reports-calculations";
import { createExcelFromRows, createExcelWithSheets } from "@/lib/excel-export";
import { createExcelBuffer, uploadToGoogleDrive } from "@/lib/google-drive-export";
import { useToast } from "@/components/ui/toast";
import type { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, ArrowUpDown } from "lucide-react";

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
  prsThisWeek?: number;
  prsThisMonth?: number;
  averageCalories?: number | null;
  averageProtein?: number | null;
  averageCarbs?: number | null;
  averageFat?: number | null;
  nutritionCompliance?: number;
}

function ReportsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const [reports, setReports] = useState<TraineeReport[]>([]);
  const [stats, setStats] = useState({
    activeTrainees: 0,
    workoutsToday: { completed: 0, total: 0 },
    averageCompliance: 0,
    alerts: 0,
  });
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("month");
  const [traineeFilter, setTraineeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [complianceFilter, setComplianceFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortBy, setSortBy] = useState<"name" | "workouts" | "compliance" | "weight" | "lastWorkout">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
      const [logsMap, weightsMap, statusData, nutritionLogsMap] = await Promise.all([
        getWorkoutLogsForUsers(traineeIds, startDate),
        getBodyWeightHistoryForUsers(traineeIds),
        getTraineesWithStatus(trainerId),
        getDailyNutritionLogsForUsers(traineeIds, startDate).catch(() => new Map()),
      ]);

      // 4. Process data in memory (much faster than network requests)
      const reportsData: TraineeReport[] = trainees.map(trainee => {
        const logs = logsMap.get(trainee.id) || [];
        const weightHistory = weightsMap.get(trainee.id) || [];
        const nutritionLogs = nutritionLogsMap.get(trainee.id) || [];
        const traineeStatus = statusData.find(s => s.id === trainee.id);

        // Use shared calculation function
        const stats = calculateTraineeStats(logs, weightHistory, timeFilter);
        
        // Calculate PRs
        const prs = calculatePRs(logs, timeFilter);
        
        // Calculate nutrition stats
        const nutritionStats = calculateNutritionStats(nutritionLogs, timeFilter);

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
          prsThisWeek: prs.prsThisWeek,
          prsThisMonth: prs.prsThisMonth,
          averageCalories: nutritionStats.averageCalories,
          averageProtein: nutritionStats.averageProtein,
          averageCarbs: nutritionStats.averageCarbs,
          averageFat: nutritionStats.averageFat,
          nutritionCompliance: nutritionStats.nutritionCompliance,
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
    // Table Headers
    const headers = [
      "שם המתאמן",
      "תוכנית אימונים",
      "סטטוס",
      "אימונים (סה\"כ)",
      "אימונים (שבוע)",
      "אימונים (חודש)",
      "התאמה (%)",
      "משקל ממוצע (ק\"ג)",
      "שינוי משקל (ק\"ג)",
      "אימון אחרון"
    ];

    // Column widths in Excel (wch units - approximately character width)
    const columnWidths = [20, 25, 12, 15, 15, 15, 12, 18, 18, 15];

    // Prepare data rows
    const rows = reports.map(r => [
      r.name,
      r.planName,
      r.status === 'active' ? 'פעיל' : 'לא פעיל',
      String(r.totalWorkouts),
      String(r.workoutsThisWeek),
      String(r.workoutsThisMonth),
      String(r.compliance),
      r.averageWeight ? String(r.averageWeight.toFixed(1)) : "אין",
      r.weightChange !== null ? `${r.weightChange > 0 ? '+' : ''}${r.weightChange.toFixed(1)}` : "אין",
      formatDate(r.lastWorkout)
    ]);

    // Summary statistics
    const summaryRows = [
      { label: 'מתאמנים פעילים:', value: String(stats.activeTrainees) },
      { label: 'אימונים היום:', value: `${stats.workoutsToday.completed} מתוך ${stats.workoutsToday.total}` },
      { label: 'התאמה ממוצעת:', value: `${stats.averageCompliance}%` },
      { label: 'התראות:', value: String(stats.alerts) },
      { label: 'תקופה:', value: timeFilter === 'week' ? 'שבוע אחרון' : timeFilter === 'month' ? 'חודש אחרון' : 'כל הזמנים' }
    ];

    const filename = `דוח_כללי_${new Date().toISOString().split('T')[0]}.xlsx`;

    try {
      createExcelFromRows(headers, rows, filename, {
        columnWidths,
        sheetName: 'דוח כללי',
        rtl: true,
        title: 'דוח כללי - מתאמנים',
        subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
        summaryRows
      });
      showToast("הדוח יוצא בהצלחה", "success");
    } catch (error: any) {
      console.error("Error exporting report:", error);
      showToast("שגיאה בייצוא הדוח: " + (error.message || "שגיאה לא ידועה"), "error");
    }
  };

  const exportReportToGoogleDrive = async () => {
    try {
      setUploadingToDrive(true);

      // Table Headers
      const headers = [
        "שם המתאמן",
        "תוכנית אימונים",
        "סטטוס",
        "אימונים (סה\"כ)",
        "אימונים (שבוע)",
        "אימונים (חודש)",
        "התאמה (%)",
        "משקל ממוצע (ק\"ג)",
        "שינוי משקל (ק\"ג)",
        "אימון אחרון"
      ];

      const columnWidths = [20, 25, 12, 15, 15, 15, 12, 18, 18, 15];

      const rows = reports.map(r => [
        r.name,
        r.planName,
        r.status === 'active' ? 'פעיל' : 'לא פעיל',
        String(r.totalWorkouts),
        String(r.workoutsThisWeek),
        String(r.workoutsThisMonth),
        String(r.compliance),
        r.averageWeight ? String(r.averageWeight.toFixed(1)) : "אין",
        r.weightChange !== null ? `${r.weightChange > 0 ? '+' : ''}${r.weightChange.toFixed(1)}` : "אין",
        formatDate(r.lastWorkout)
      ]);

      const summaryRows = [
        { label: 'מתאמנים פעילים:', value: String(stats.activeTrainees) },
        { label: 'אימונים היום:', value: `${stats.workoutsToday.completed} מתוך ${stats.workoutsToday.total}` },
        { label: 'התאמה ממוצעת:', value: `${stats.averageCompliance}%` },
        { label: 'התראות:', value: String(stats.alerts) },
        { label: 'תקופה:', value: timeFilter === 'week' ? 'שבוע אחרון' : timeFilter === 'month' ? 'חודש אחרון' : 'כל הזמנים' }
      ];

      const filename = `דוח_כללי_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Create Excel buffer
      const buffer = createExcelBuffer([{
        name: 'דוח כללי',
        title: 'דוח כללי - מתאמנים',
        subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
        summaryRows,
        headers,
        rows,
        columnWidths
      }], true);

      // Upload to Google Drive
      const result = await uploadToGoogleDrive(buffer, filename);

      if (result.success) {
        showToast("הדוח הועלה בהצלחה ל-Google Drive!", "success");
      } else {
        if (result.error?.includes('setupRequired') || result.error?.includes('לא מוגדרים')) {
          showToast("נדרשת הגדרת Google Drive. ראה הוראות בקונסול.", "warning");
          console.log("הוראות הגדרה: https://console.cloud.google.com/");
        } else {
          showToast("שגיאה בהעלאת הדוח: " + (result.error || "שגיאה לא ידועה"), "error");
        }
      }
    } catch (error: any) {
      console.error("Error exporting to Google Drive:", error);
      showToast("שגיאה בייצוא הדוח: " + (error.message || "שגיאה לא ידועה"), "error");
    } finally {
      setUploadingToDrive(false);
    }
  };

  const exportTraineeReport = async (report: TraineeReport) => {
    try {
      // Calculate start date for filtering
      const now = new Date();
      let startDate: string | undefined;
      let periodLabel = '';

      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        periodLabel = 'שבוע אחרון';
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
        periodLabel = 'חודש אחרון';
      } else {
        periodLabel = 'כל הזמנים';
      }

      // Load detailed data
      const [logs, weightHistory] = await Promise.all([
        getWorkoutLogs(report.id, undefined, startDate),
        getBodyWeightHistory(report.id),
      ]);

      const completedLogs = logs.filter(log => log.completed);

      // Prepare Excel sheets
      const sheets: Array<{
        name: string;
        title?: string;
        subtitle?: string;
        summaryRows?: Array<{ label: string; value: string }>;
        headers: string[];
        rows: (string | number | null | undefined)[][];
        columnWidths?: number[];
      }> = [];

      // Sheet 1: Exercise Summary (grouped by exercise)
      if (completedLogs.length > 0) {
        // Calculate date ranges for monthly improvement
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

        // Group all sets by exercise
        const exerciseStats = new Map<string, {
          name: string;
          workoutCount: number;
          totalSets: number;
          maxWeight: number;
          minWeight: number;
          lastMonthMaxWeight: number;
          previousMonthMaxWeight: number;
          lastWorkoutDate: string;
        }>();

        completedLogs.forEach(log => {
          const logDate = log.date || '';
          const logDateObj = new Date(logDate);

          if (log.set_logs && log.set_logs.length > 0) {
            const exercisesInWorkout = new Set<string>();
            
            log.set_logs.forEach((setLog) => {
              const exerciseName = setLog.exercise?.name || 'תרגיל לא ידוע';
              const exerciseId = setLog.exercise_id || exerciseName;
              
              if (!exerciseStats.has(exerciseId)) {
                exerciseStats.set(exerciseId, {
                  name: exerciseName,
                  workoutCount: 0,
                  totalSets: 0,
                  maxWeight: 0,
                  minWeight: Infinity,
                  lastMonthMaxWeight: 0,
                  previousMonthMaxWeight: 0,
                  lastWorkoutDate: ''
                });
              }

              const stats = exerciseStats.get(exerciseId)!;
              
              // Count unique workouts per exercise
              if (!exercisesInWorkout.has(exerciseId)) {
                exercisesInWorkout.add(exerciseId);
                stats.workoutCount++;
              }

              // Collect data
              stats.totalSets++;
              const weight = setLog.weight_kg || 0;
              
              if (weight > 0) {
                // Overall max/min
                if (weight > stats.maxWeight) {
                  stats.maxWeight = weight;
                }
                if (weight < stats.minWeight) {
                  stats.minWeight = weight;
                }

                // Last month max weight
                if (logDateObj >= lastMonthStart && logDateObj <= lastMonthEnd) {
                  if (weight > stats.lastMonthMaxWeight) {
                    stats.lastMonthMaxWeight = weight;
                  }
                }

                // Previous month max weight
                if (logDateObj >= previousMonthStart && logDateObj <= previousMonthEnd) {
                  if (weight > stats.previousMonthMaxWeight) {
                    stats.previousMonthMaxWeight = weight;
                  }
                }
              }

              // Update last workout date
              if (!stats.lastWorkoutDate || logDate > stats.lastWorkoutDate) {
                stats.lastWorkoutDate = logDate;
              }
            });
          }
        });

        // Convert to rows
        const workoutHeaders = [
          "תרגיל",
          "מספר אימונים",
          "סטים ליום",
          "משקל מינימלי (ק\"ג)",
          "משקל מקסימלי (ק\"ג)",
          "שיפור החודש (ק\"ג)",
          "אימון אחרון"
        ];
        
        const workoutColumnWidths = [30, 15, 12, 18, 18, 18, 15];
        
        const workoutRows: (string | number | null | undefined)[][] = [];
        
        // Sort by last workout date (most recent first)
        const sortedExercises = Array.from(exerciseStats.entries())
          .sort((a, b) => {
            const dateA = a[1].lastWorkoutDate;
            const dateB = b[1].lastWorkoutDate;
            return dateB.localeCompare(dateA);
          });

        sortedExercises.forEach(([exerciseId, stats]) => {
          // Calculate average sets per day
          const avgSetsPerDay = stats.workoutCount > 0
            ? (stats.totalSets / stats.workoutCount).toFixed(1)
            : '0';

          // Calculate monthly improvement
          let monthlyImprovement = '';
          if (stats.lastMonthMaxWeight > 0 && stats.previousMonthMaxWeight > 0) {
            const improvement = stats.lastMonthMaxWeight - stats.previousMonthMaxWeight;
            monthlyImprovement = improvement > 0 
              ? `+${improvement.toFixed(1)}`
              : improvement.toFixed(1);
          } else if (stats.lastMonthMaxWeight > 0) {
            monthlyImprovement = `+${stats.lastMonthMaxWeight.toFixed(1)}`;
          } else {
            monthlyImprovement = 'אין נתונים';
          }

          const lastWorkoutFormatted = stats.lastWorkoutDate
            ? new Date(stats.lastWorkoutDate).toLocaleDateString('he-IL')
            : 'אין';

          const minWeightDisplay = (stats.minWeight !== Infinity && stats.minWeight > 0) 
            ? stats.minWeight.toFixed(1) 
            : 'אין';

          workoutRows.push([
            stats.name,
            String(stats.workoutCount),
            avgSetsPerDay,
            minWeightDisplay,
            stats.maxWeight > 0 ? stats.maxWeight.toFixed(1) : 'אין',
            monthlyImprovement,
            lastWorkoutFormatted
          ]);
        });

        // Add summary row at the end
        if (sortedExercises.length > 0) {
          let totalExercises = sortedExercises.length;
          let totalWorkouts = 0;
          let totalSets = 0;
          let overallMaxWeight = 0;
          let overallMinWeight = Infinity;
          let totalMonthlyImprovement = 0;
          let exercisesWithImprovement = 0;

          sortedExercises.forEach(([exerciseId, stats]) => {
            totalWorkouts += stats.workoutCount;
            totalSets += stats.totalSets;
            
            if (stats.maxWeight > overallMaxWeight) {
              overallMaxWeight = stats.maxWeight;
            }
            
            if (stats.minWeight !== Infinity && stats.minWeight < overallMinWeight) {
              overallMinWeight = stats.minWeight;
            }

            // Calculate monthly improvement for average
            if (stats.lastMonthMaxWeight > 0 && stats.previousMonthMaxWeight > 0) {
              const improvement = stats.lastMonthMaxWeight - stats.previousMonthMaxWeight;
              totalMonthlyImprovement += improvement;
              exercisesWithImprovement++;
            } else if (stats.lastMonthMaxWeight > 0) {
              totalMonthlyImprovement += stats.lastMonthMaxWeight;
              exercisesWithImprovement++;
            }
          });

          const avgSetsPerDayOverall = totalWorkouts > 0 
            ? (totalSets / totalWorkouts).toFixed(1)
            : '0';

          const avgMonthlyImprovement = exercisesWithImprovement > 0
            ? (totalMonthlyImprovement / exercisesWithImprovement).toFixed(1)
            : '0';

          const overallMinWeightDisplay = overallMinWeight !== Infinity && overallMinWeight > 0
            ? overallMinWeight.toFixed(1)
            : 'אין';

          // Add empty row for spacing
          workoutRows.push([]);
          
          // Add summary row
          workoutRows.push([
            'סיכום',
            String(totalExercises),
            avgSetsPerDayOverall,
            overallMinWeightDisplay,
            overallMaxWeight > 0 ? overallMaxWeight.toFixed(1) : 'אין',
            avgMonthlyImprovement !== '0' 
              ? (parseFloat(avgMonthlyImprovement) > 0 ? `+${avgMonthlyImprovement}` : avgMonthlyImprovement)
              : 'אין נתונים',
            '-'
          ]);
        }

        const workoutSummaryRows = [
          { label: 'שם המתאמן:', value: report.name },
          { label: 'תוכנית אימונים:', value: report.planName },
          { label: 'סטטוס:', value: report.status === 'active' ? 'פעיל' : 'לא פעיל' },
          { label: 'אימונים סה"כ:', value: String(report.totalWorkouts) },
          { label: 'אימונים השבוע:', value: String(report.workoutsThisWeek) },
          { label: 'אימונים החודש:', value: String(report.workoutsThisMonth) },
          { label: 'התאמה לתוכנית:', value: `${report.compliance}%` },
          { label: 'תקופה:', value: periodLabel }
        ];

        sheets.push({
          name: 'תרגילים',
          title: `דוח מפורט - ${report.name}`,
          subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
          summaryRows: workoutSummaryRows,
          headers: workoutHeaders,
          rows: workoutRows,
          columnWidths: workoutColumnWidths
        });
      }

      // Sheet 2: Weight History
      if (weightHistory.length > 0) {
        const weightHeaders = ["תאריך", "משקל (ק\"ג)", "שינוי (ק\"ג)"];
        const weightColumnWidths = [15, 18, 15];
        
        const weightRows: (string | number | null | undefined)[][] = [];
        weightHistory.forEach((w, index) => {
          const change = index > 0 ? (weightHistory[index - 1].weight - w.weight).toFixed(1) : '';
          weightRows.push([w.date, w.weight.toFixed(1), change]);
        });

        const weightSummaryRows = [
          { label: 'משקל ממוצע:', value: report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : 'אין נתונים' },
          { label: 'שינוי משקל:', value: report.weightChange !== null 
            ? `${report.weightChange > 0 ? '+' : ''}${report.weightChange.toFixed(1)} ק"ג` 
            : 'אין נתונים' },
          { label: 'מספר שקילות:', value: String(weightHistory.length) }
        ];

        sheets.push({
          name: 'משקל',
          title: `היסטוריית משקל - ${report.name}`,
          subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
          summaryRows: weightSummaryRows,
          headers: weightHeaders,
          rows: weightRows,
          columnWidths: weightColumnWidths
        });
      }

      // Create Excel file with multiple sheets
      const safeName = report.name.replace(/[^a-zA-Z0-9א-ת]/g, '_');
      const filename = `דוח_מפורט_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (sheets.length > 0) {
        createExcelWithSheets(sheets, filename, true);
        showToast("הדוח יוצא בהצלחה", "success");
      } else {
        showToast("אין נתונים לייצוא", "warning");
      }
    } catch (error: any) {
      console.error("Error exporting trainee report:", error);
      showToast("שגיאה בייצוא הדוח: " + (error.message || "שגיאה לא ידועה"), "error");
    }
  };

  const exportTraineeReportToGoogleDrive = async (report: TraineeReport) => {
    try {
      setUploadingToDrive(true);

      // Calculate start date for filtering
      const now = new Date();
      let startDate: string | undefined;
      let periodLabel = '';

      if (timeFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString().split('T')[0];
        periodLabel = 'שבוע אחרון';
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString().split('T')[0];
        periodLabel = 'חודש אחרון';
      } else {
        periodLabel = 'כל הזמנים';
      }

      // Load detailed data
      const [logs, weightHistory] = await Promise.all([
        getWorkoutLogs(report.id, undefined, startDate),
        getBodyWeightHistory(report.id),
      ]);

      const completedLogs = logs.filter(log => log.completed);

      // Prepare Excel sheets (same logic as exportTraineeReport)
      const sheets: Array<{
        name: string;
        title?: string;
        subtitle?: string;
        summaryRows?: Array<{ label: string; value: string }>;
        headers: string[];
        rows: (string | number | null | undefined)[][];
        columnWidths?: number[];
      }> = [];

      // Sheet 1: Exercise Summary
      if (completedLogs.length > 0) {
        // Calculate date ranges for monthly improvement
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

        const exerciseStats = new Map<string, {
          name: string;
          workoutCount: number;
          totalSets: number;
          maxWeight: number;
          minWeight: number;
          lastMonthMaxWeight: number;
          previousMonthMaxWeight: number;
          lastWorkoutDate: string;
        }>();

        completedLogs.forEach(log => {
          const logDate = log.date || '';
          const logDateObj = new Date(logDate);

          if (log.set_logs && log.set_logs.length > 0) {
            const exercisesInWorkout = new Set<string>();
            
            log.set_logs.forEach((setLog) => {
              const exerciseName = setLog.exercise?.name || 'תרגיל לא ידוע';
              const exerciseId = setLog.exercise_id || exerciseName;
              
              if (!exerciseStats.has(exerciseId)) {
                exerciseStats.set(exerciseId, {
                  name: exerciseName,
                  workoutCount: 0,
                  totalSets: 0,
                  maxWeight: 0,
                  minWeight: Infinity,
                  lastMonthMaxWeight: 0,
                  previousMonthMaxWeight: 0,
                  lastWorkoutDate: ''
                });
              }

              const stats = exerciseStats.get(exerciseId)!;
              
              if (!exercisesInWorkout.has(exerciseId)) {
                exercisesInWorkout.add(exerciseId);
                stats.workoutCount++;
              }

              stats.totalSets++;
              const weight = setLog.weight_kg || 0;
              
              if (weight > 0) {
                if (weight > stats.maxWeight) {
                  stats.maxWeight = weight;
                }
                if (weight < stats.minWeight) {
                  stats.minWeight = weight;
                }

                if (logDateObj >= lastMonthStart && logDateObj <= lastMonthEnd) {
                  if (weight > stats.lastMonthMaxWeight) {
                    stats.lastMonthMaxWeight = weight;
                  }
                }

                if (logDateObj >= previousMonthStart && logDateObj <= previousMonthEnd) {
                  if (weight > stats.previousMonthMaxWeight) {
                    stats.previousMonthMaxWeight = weight;
                  }
                }
              }

              if (!stats.lastWorkoutDate || logDate > stats.lastWorkoutDate) {
                stats.lastWorkoutDate = logDate;
              }
            });
          }
        });

        const workoutHeaders = [
          "תרגיל",
          "מספר אימונים",
          "סטים ליום",
          "משקל מינימלי (ק\"ג)",
          "משקל מקסימלי (ק\"ג)",
          "שיפור החודש (ק\"ג)",
          "אימון אחרון"
        ];
        
        const workoutColumnWidths = [30, 15, 12, 18, 18, 18, 15];
        
        const workoutRows: (string | number | null | undefined)[][] = [];
        
        const sortedExercises = Array.from(exerciseStats.entries())
          .sort((a, b) => {
            const dateA = a[1].lastWorkoutDate;
            const dateB = b[1].lastWorkoutDate;
            return dateB.localeCompare(dateA);
          });

        sortedExercises.forEach(([exerciseId, stats]) => {
          const avgSetsPerDay = stats.workoutCount > 0
            ? (stats.totalSets / stats.workoutCount).toFixed(1)
            : '0';

          let monthlyImprovement = '';
          if (stats.lastMonthMaxWeight > 0 && stats.previousMonthMaxWeight > 0) {
            const improvement = stats.lastMonthMaxWeight - stats.previousMonthMaxWeight;
            monthlyImprovement = improvement > 0 
              ? `+${improvement.toFixed(1)}`
              : improvement.toFixed(1);
          } else if (stats.lastMonthMaxWeight > 0) {
            monthlyImprovement = `+${stats.lastMonthMaxWeight.toFixed(1)}`;
          } else {
            monthlyImprovement = 'אין נתונים';
          }

          const lastWorkoutFormatted = stats.lastWorkoutDate
            ? new Date(stats.lastWorkoutDate).toLocaleDateString('he-IL')
            : 'אין';

          const minWeightDisplay = (stats.minWeight !== Infinity && stats.minWeight > 0) 
            ? stats.minWeight.toFixed(1) 
            : 'אין';

          workoutRows.push([
            stats.name,
            String(stats.workoutCount),
            avgSetsPerDay,
            minWeightDisplay,
            stats.maxWeight > 0 ? stats.maxWeight.toFixed(1) : 'אין',
            monthlyImprovement,
            lastWorkoutFormatted
          ]);
        });

        // Add summary row
        if (sortedExercises.length > 0) {
          let totalExercises = sortedExercises.length;
          let totalWorkouts = 0;
          let totalSets = 0;
          let overallMaxWeight = 0;
          let overallMinWeight = Infinity;
          let totalMonthlyImprovement = 0;
          let exercisesWithImprovement = 0;

          sortedExercises.forEach(([exerciseId, stats]) => {
            totalWorkouts += stats.workoutCount;
            totalSets += stats.totalSets;
            
            if (stats.maxWeight > overallMaxWeight) {
              overallMaxWeight = stats.maxWeight;
            }
            
            if (stats.minWeight !== Infinity && stats.minWeight < overallMinWeight) {
              overallMinWeight = stats.minWeight;
            }

            if (stats.lastMonthMaxWeight > 0 && stats.previousMonthMaxWeight > 0) {
              const improvement = stats.lastMonthMaxWeight - stats.previousMonthMaxWeight;
              totalMonthlyImprovement += improvement;
              exercisesWithImprovement++;
            } else if (stats.lastMonthMaxWeight > 0) {
              totalMonthlyImprovement += stats.lastMonthMaxWeight;
              exercisesWithImprovement++;
            }
          });

          const avgSetsPerDayOverall = totalWorkouts > 0 
            ? (totalSets / totalWorkouts).toFixed(1)
            : '0';

          const avgMonthlyImprovement = exercisesWithImprovement > 0
            ? (totalMonthlyImprovement / exercisesWithImprovement).toFixed(1)
            : '0';

          const overallMinWeightDisplay = overallMinWeight !== Infinity && overallMinWeight > 0
            ? overallMinWeight.toFixed(1)
            : 'אין';

          workoutRows.push([]);
          workoutRows.push([
            'סיכום',
            String(totalExercises),
            avgSetsPerDayOverall,
            overallMinWeightDisplay,
            overallMaxWeight > 0 ? overallMaxWeight.toFixed(1) : 'אין',
            avgMonthlyImprovement !== '0' 
              ? (parseFloat(avgMonthlyImprovement) > 0 ? `+${avgMonthlyImprovement}` : avgMonthlyImprovement)
              : 'אין נתונים',
            '-'
          ]);
        }

        const workoutSummaryRows = [
          { label: 'שם המתאמן:', value: report.name },
          { label: 'תוכנית אימונים:', value: report.planName },
          { label: 'סטטוס:', value: report.status === 'active' ? 'פעיל' : 'לא פעיל' },
          { label: 'אימונים סה"כ:', value: String(report.totalWorkouts) },
          { label: 'אימונים השבוע:', value: String(report.workoutsThisWeek) },
          { label: 'אימונים החודש:', value: String(report.workoutsThisMonth) },
          { label: 'התאמה לתוכנית:', value: `${report.compliance}%` },
          { label: 'תקופה:', value: periodLabel }
        ];

        sheets.push({
          name: 'תרגילים',
          title: `דוח מפורט - ${report.name}`,
          subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
          summaryRows: workoutSummaryRows,
          headers: workoutHeaders,
          rows: workoutRows,
          columnWidths: workoutColumnWidths
        });
      }

      // Sheet 2: Weight History
      if (weightHistory.length > 0) {
        const weightHeaders = ["תאריך", "משקל (ק\"ג)", "שינוי (ק\"ג)"];
        const weightColumnWidths = [15, 18, 15];
        
        const weightRows: (string | number | null | undefined)[][] = [];
        weightHistory.forEach((w, index) => {
          const change = index > 0 ? (weightHistory[index - 1].weight - w.weight).toFixed(1) : '';
          weightRows.push([w.date, w.weight.toFixed(1), change]);
        });

        const weightSummaryRows = [
          { label: 'משקל ממוצע:', value: report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : 'אין נתונים' },
          { label: 'שינוי משקל:', value: report.weightChange !== null 
            ? `${report.weightChange > 0 ? '+' : ''}${report.weightChange.toFixed(1)} ק"ג` 
            : 'אין נתונים' },
          { label: 'מספר שקילות:', value: String(weightHistory.length) }
        ];

        sheets.push({
          name: 'משקל',
          title: `היסטוריית משקל - ${report.name}`,
          subtitle: `תאריך: ${new Date().toLocaleDateString('he-IL')}`,
          summaryRows: weightSummaryRows,
          headers: weightHeaders,
          rows: weightRows,
          columnWidths: weightColumnWidths
        });
      }

      const safeName = report.name.replace(/[^a-zA-Z0-9א-ת]/g, '_');
      const filename = `דוח_מפורט_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (sheets.length > 0) {
        // Create Excel buffer
        const buffer = createExcelBuffer(sheets, true);

        // Upload to Google Drive
        const result = await uploadToGoogleDrive(buffer, filename);

        if (result.success) {
          showToast("הדוח הועלה בהצלחה ל-Google Drive!", "success");
        } else {
          if (result.error?.includes('setupRequired') || result.error?.includes('לא מוגדרים')) {
            showToast("נדרשת הגדרת Google Drive. ראה הוראות בקונסול.", "warning");
            console.log("הוראות הגדרה: https://console.cloud.google.com/");
          } else {
            showToast("שגיאה בהעלאת הדוח: " + (result.error || "שגיאה לא ידועה"), "error");
          }
        }
      } else {
        showToast("אין נתונים לייצוא", "warning");
      }
    } catch (error: any) {
      console.error("Error exporting trainee report to Google Drive:", error);
      showToast("שגיאה בייצוא הדוח: " + (error.message || "שגיאה לא ידועה"), "error");
    } finally {
      setUploadingToDrive(false);
    }
  };


  // Skeleton Components
  const SkeletonReportCard = () => (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </Card>
  );

  const SkeletonStatCard = () => (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, subValue, colorTheme }: { title: string; value: string | number; icon: any; subValue?: string; colorTheme: 'blue' | 'indigo' | 'emerald' | 'orange' | 'red' }) => {
    const themes = {
      blue: { 
        bg: "bg-gradient-to-br from-blue-500/80 to-blue-600/50 dark:from-blue-600/40 dark:to-blue-800/20", 
        text: "text-white dark:text-blue-100", 
        iconBg: "bg-white/20 dark:bg-blue-500/20",
      },
      indigo: { 
        bg: "bg-gradient-to-br from-indigo-500/80 to-indigo-600/50 dark:from-indigo-600/40 dark:to-indigo-800/20", 
        text: "text-white dark:text-indigo-100", 
        iconBg: "bg-white/20 dark:bg-indigo-500/20",
      },
      emerald: { 
        bg: "bg-gradient-to-br from-emerald-500/80 to-emerald-600/50 dark:from-emerald-600/40 dark:to-emerald-800/20", 
        text: "text-white dark:text-emerald-100", 
        iconBg: "bg-white/20 dark:bg-emerald-500/20",
      },
      orange: { 
        bg: "bg-gradient-to-br from-orange-500/80 to-orange-600/50 dark:from-orange-600/40 dark:to-orange-800/20", 
        text: "text-white dark:text-orange-100", 
        iconBg: "bg-white/20 dark:bg-orange-500/20",
      },
      red: { 
        bg: "bg-gradient-to-br from-red-500/80 to-red-600/50 dark:from-red-600/40 dark:to-red-800/20", 
        text: "text-white dark:text-red-100", 
        iconBg: "bg-white/20 dark:bg-red-500/20",
      },
    };
    
    const theme = themes[colorTheme];

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
            <div className={`text-2xl sm:text-3xl font-black ${theme.text} tracking-tight`}>
              {value}
            </div>
            {subValue && (
              <div className={`text-xs sm:text-sm font-semibold ${theme.text} opacity-75`}>
                {subValue}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Quick Stats
  const quickStats = useMemo(() => {
    const workoutsThisWeek = reports.reduce((sum, r) => sum + r.workoutsThisWeek, 0);
    const prsThisWeek = reports.reduce((sum, r) => sum + (r.prsThisWeek || 0), 0);
    
    return {
      activeTrainees: stats.activeTrainees,
      workoutsToday: stats.workoutsToday,
      averageCompliance: stats.averageCompliance,
      alerts: stats.alerts,
      workoutsThisWeek,
      prsThisWeek,
    };
  }, [reports, stats]);

  // Filtered and sorted reports
  const filteredAndSortedReports = useMemo(() => {
    let filtered = [...reports];
    
    // Trainee filter
    if (traineeFilter !== 'all') {
      filtered = filtered.filter(r => r.id === traineeFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Compliance filter
    if (complianceFilter !== 'all') {
      filtered = filtered.filter(r => {
        if (complianceFilter === 'high') return r.compliance >= 80;
        if (complianceFilter === 'medium') return r.compliance >= 50 && r.compliance < 80;
        if (complianceFilter === 'low') return r.compliance < 50;
        return true;
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'he');
          break;
        case 'workouts':
          comparison = b.totalWorkouts - a.totalWorkouts;
          break;
        case 'compliance':
          comparison = b.compliance - a.compliance;
          break;
        case 'weight':
          const weightA = a.averageWeight || 0;
          const weightB = b.averageWeight || 0;
          comparison = weightB - weightA;
          break;
        case 'lastWorkout':
          const dateA = a.lastWorkout ? new Date(a.lastWorkout).getTime() : 0;
          const dateB = b.lastWorkout ? new Date(b.lastWorkout).getTime() : 0;
          comparison = dateB - dateA;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [reports, traineeFilter, statusFilter, complianceFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-32" dir="rtl">
      {/* --- Page Header & Actions --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">דוחות וסטטיסטיקות</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">סקירה כללית של ביצועי המתאמנים</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex gap-1 bg-white dark:bg-slate-900/50 p-1 rounded-xl border border-gray-200 dark:border-slate-800 w-full sm:w-auto">
            <Button
              size="sm"
              variant={timeFilter === "week" ? "default" : "ghost"}
              onClick={() => setTimeFilter("week")}
              className={timeFilter === "week" 
                ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none" 
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"}
            >
              שבוע
            </Button>
            <Button
              size="sm"
              variant={timeFilter === "month" ? "default" : "ghost"}
              onClick={() => setTimeFilter("month")}
              className={timeFilter === "month" 
                ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none" 
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"}
            >
              חודש
            </Button>
            <Button
              size="sm"
              variant={timeFilter === "all" ? "default" : "ghost"}
              onClick={() => setTimeFilter("all")}
              className={timeFilter === "all" 
                ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none" 
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"}
            >
              הכל
            </Button>
          </div>
          <Button
            onClick={exportReport}
            className="gap-2 shadow-sm rounded-xl h-10 px-4 sm:px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-none w-full sm:w-auto text-sm sm:text-base"
          >
            <Download className="h-4 w-4" />
            <span>ייצא ל-Excel</span>
          </Button>
          <Button
            onClick={exportReportToGoogleDrive}
            disabled={uploadingToDrive}
            className="gap-2 shadow-sm rounded-xl h-10 px-4 sm:px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-none w-full sm:w-auto text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingToDrive ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>מעלה...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>ייצא ל-Google Drive</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* --- Filters & Sorting --- */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex gap-1 bg-white dark:bg-slate-900/50 p-1 rounded-xl border border-gray-200 dark:border-slate-800 w-full sm:w-auto">
          <Button
            size="sm"
            variant={timeFilter === "week" ? "default" : "ghost"}
            onClick={() => setTimeFilter("week")}
            className={timeFilter === "week" 
              ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none" 
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"}
          >
            שבוע
          </Button>
          <Button
            size="sm"
            variant={timeFilter === "month" ? "default" : "ghost"}
            onClick={() => setTimeFilter("month")}
            className={timeFilter === "month" 
              ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none" 
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"}
          >
            חודש
          </Button>
          <Button
            size="sm"
            variant={timeFilter === "all" ? "default" : "ghost"}
            onClick={() => setTimeFilter("all")}
            className={timeFilter === "all" 
              ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none" 
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-lg h-8 px-3 text-xs sm:text-sm flex-1 sm:flex-none"}
          >
            הכל
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
              <Filter className="h-4 w-4 ml-2" />
              <span className="hidden sm:inline">פילטר מתאמן</span>
              <span className="sm:hidden">מתאמן</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setTraineeFilter('all')}>
              כל המתאמנים
            </DropdownMenuItem>
            {reports.map(report => (
              <DropdownMenuItem key={report.id} onClick={() => setTraineeFilter(report.id)}>
                {report.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
              <Filter className="h-4 w-4 ml-2" />
              <span className="hidden sm:inline">פילטר סטטוס</span>
              <span className="sm:hidden">סטטוס</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              כל הסטטוסים
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              פעיל בלבד
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
              לא פעיל בלבד
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
              <Filter className="h-4 w-4 ml-2" />
              <span className="hidden sm:inline">פילטר התאמה</span>
              <span className="sm:hidden">התאמה</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setComplianceFilter('all')}>
              כל ההתאמות
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setComplianceFilter('high')}>
              גבוהה (≥80%)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setComplianceFilter('medium')}>
              בינונית (50-79%)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setComplianceFilter('low')}>
              נמוכה (&lt;50%)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl">
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <span className="hidden sm:inline">מיון</span>
              <span className="sm:hidden">מיון</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc'); }}>
              לפי שם {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy('workouts'); setSortOrder(sortBy === 'workouts' && sortOrder === 'desc' ? 'asc' : 'desc'); }}>
              לפי אימונים {sortBy === 'workouts' && (sortOrder === 'desc' ? '↓' : '↑')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy('compliance'); setSortOrder(sortBy === 'compliance' && sortOrder === 'desc' ? 'asc' : 'desc'); }}>
              לפי התאמה {sortBy === 'compliance' && (sortOrder === 'desc' ? '↓' : '↑')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy('weight'); setSortOrder(sortBy === 'weight' && sortOrder === 'desc' ? 'asc' : 'desc'); }}>
              לפי משקל {sortBy === 'weight' && (sortOrder === 'desc' ? '↓' : '↑')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSortBy('lastWorkout'); setSortOrder(sortBy === 'lastWorkout' && sortOrder === 'desc' ? 'asc' : 'desc'); }}>
              לפי אימון אחרון {sortBy === 'lastWorkout' && (sortOrder === 'desc' ? '↓' : '↑')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              title="מתאמנים פעילים"
              value={quickStats.activeTrainees}
              icon={Users}
              colorTheme="blue"
            />
            <StatCard
              title="אימונים היום"
              value={quickStats.workoutsToday.completed}
              subValue={`מתוך ${quickStats.workoutsToday.total}`}
              icon={Activity}
              colorTheme="indigo"
            />
            <StatCard
              title="אימונים השבוע"
              value={quickStats.workoutsThisWeek}
              icon={Calendar}
              colorTheme="emerald"
            />
            <StatCard
              title="PRs השבוע"
              value={quickStats.prsThisWeek}
              icon={Award}
              colorTheme="orange"
            />
            <StatCard
              title="התאמה ממוצעת"
              value={`${quickStats.averageCompliance}%`}
              icon={Target}
              colorTheme="blue"
            />
            <StatCard
              title="התראות"
              value={quickStats.alerts}
              icon={AlertTriangle}
              colorTheme="red"
            />
          </>
        )}
      </div>

      {/* --- Reports Table --- */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">דוחות מתאמנים</CardTitle>
            </div>
            {reports.length > 0 && (
              <div className="bg-blue-100 dark:bg-blue-900/50 px-2 sm:px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-500/30">
                <span className="text-blue-600 dark:text-blue-400 font-black text-xs">{reports.length}</span>
                <span className="text-gray-500 dark:text-slate-400 text-xs mr-1">מתאמנים</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3 p-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <SkeletonReportCard key={i} />
                ))}
              </div>
            ) : filteredAndSortedReports.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block">
                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400 mx-auto" />
                  </div>
                  <p className="text-gray-900 dark:text-white font-bold text-lg sm:text-xl">אין נתונים להצגה</p>
                  <p className="text-gray-500 dark:text-slate-400 text-sm sm:text-base">לא נמצאו דוחות לתקופה הנבחרת</p>
                  {(traineeFilter !== 'all' || statusFilter !== 'all' || complianceFilter !== 'all') && (
                    <Button
                      onClick={() => {
                        setTraineeFilter('all');
                        setStatusFilter('all');
                        setComplianceFilter('all');
                      }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl"
                    >
                      נקה פילטרים
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              filteredAndSortedReports.map((report, index) => (
                <Card key={report.id} className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate flex-1 mr-2">{report.name}</h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                      report.status === 'active' 
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30'
                    }`}>
                      {report.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 font-medium truncate">{report.planName}</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">אימונים (סה"כ): </span>
                      <span className="font-bold text-gray-900 dark:text-white">{report.totalWorkouts}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">אימונים (שבוע): </span>
                      <span className="font-bold text-gray-900 dark:text-white">{report.workoutsThisWeek}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">אימונים (חודש): </span>
                      <span className="font-bold text-gray-900 dark:text-white">{report.workoutsThisMonth}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">PRs (שבוע): </span>
                      <span className="font-bold text-gray-900 dark:text-white">{report.prsThisWeek || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">התאמה: </span>
                      <span className="font-bold text-gray-900 dark:text-white">{report.compliance}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">משקל ממוצע: </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : "אין"}
                      </span>
                    </div>
                    {report.averageCalories && (
                      <div>
                        <span className="text-gray-500 dark:text-slate-400">קלוריות ממוצעות: </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {Math.round(report.averageCalories)}
                        </span>
                      </div>
                    )}
                    {report.averageProtein && (
                      <div>
                        <span className="text-gray-500 dark:text-slate-400">חלבון ממוצע: </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {Math.round(report.averageProtein)}ג'
                        </span>
                      </div>
                    )}
                  </div>
                  {report.weightChange !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-slate-400">שינוי משקל: </span>
                      {report.weightChange > 0 ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : report.weightChange < 0 ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : null}
                      <span className={`font-bold ${report.weightChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {report.weightChange > 0 ? '+' : ''}{report.weightChange.toFixed(1)} ק"ג
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-gray-500 dark:text-slate-400">
                    אימון אחרון: {formatDate(report.lastWorkout)}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportTraineeReport(report)}
                    className="w-full border-2 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all active:scale-95 text-sm h-9"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    ייצא דוח
                  </Button>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border-2 border-gray-200 dark:border-slate-800">
            <div className="min-w-[800px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">שם</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">תוכנית</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">סטטוס</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">אימונים (סה"כ)</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">אימונים (שבוע)</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">אימונים (חודש)</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">PRs (שבוע)</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">התאמה</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">משקל ממוצע</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">קלוריות</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">חלבון</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">שינוי משקל</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">אימון אחרון</th>
                    <th className="text-right p-2 sm:p-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider whitespace-nowrap">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-200 dark:border-slate-800">
                          <td colSpan={14} className="p-4">
                            <div className="flex items-center gap-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : filteredAndSortedReports.length === 0 ? (
                    <tr>
                          <td colSpan={13} className="text-center py-16">
                        <div className="space-y-4">
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-8 rounded-3xl inline-block">
                            <FileText className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto" />
                          </div>
                          <p className="text-gray-900 dark:text-white font-bold text-xl">אין נתונים להצגה</p>
                          <p className="text-gray-500 dark:text-slate-400">לא נמצאו דוחות לתקופה הנבחרת</p>
                          {(traineeFilter !== 'all' || statusFilter !== 'all' || complianceFilter !== 'all') && (
                            <Button
                              onClick={() => {
                                setTraineeFilter('all');
                                setStatusFilter('all');
                                setComplianceFilter('all');
                              }}
                              className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl"
                            >
                              נקה פילטרים
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedReports.map((report, index) => (
                      <tr key={report.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: `${index * 30}ms` }}>
                        <td className="p-2 sm:p-4 text-gray-900 dark:text-white font-bold text-sm sm:text-base">{report.name}</td>
                        <td className="p-2 sm:p-4 text-gray-500 dark:text-slate-400 font-medium text-xs sm:text-sm">{report.planName}</td>
                        <td className="p-2 sm:p-4">
                          <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold ${
                            report.status === 'active' 
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' 
                              : 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30'
                          }`}>
                            {report.status === 'active' ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </td>
                        <td className="p-2 sm:p-4 text-gray-900 dark:text-white font-bold text-sm sm:text-base">{report.totalWorkouts}</td>
                        <td className="p-2 sm:p-4 text-gray-900 dark:text-white font-bold text-sm sm:text-base">{report.workoutsThisWeek}</td>
                        <td className="p-2 sm:p-4 text-gray-900 dark:text-white font-bold text-sm sm:text-base">{report.workoutsThisMonth}</td>
                        <td className="p-2 sm:p-4 text-gray-900 dark:text-white font-bold text-sm sm:text-base">{report.prsThisWeek || 0}</td>
                        <td className="p-2 sm:p-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2 sm:h-2.5 max-w-[50px] sm:max-w-[70px]">
                              <div 
                                className={`h-2 sm:h-2.5 rounded-full transition-all ${
                                  report.compliance >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                  report.compliance >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                  'bg-gradient-to-r from-red-500 to-red-400'
                                }`}
                                style={{ width: `${Math.min(100, report.compliance)}%` }}
                              />
                            </div>
                            <span className="text-gray-900 dark:text-white text-xs sm:text-sm font-bold">{report.compliance}%</span>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 text-gray-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                          {report.averageWeight ? `${report.averageWeight.toFixed(1)} ק"ג` : "אין"}
                        </td>
                        <td className="p-2 sm:p-4 text-gray-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                          {report.averageCalories ? Math.round(report.averageCalories) : "אין"}
                        </td>
                        <td className="p-2 sm:p-4 text-gray-500 dark:text-slate-400 font-medium text-xs sm:text-sm">
                          {report.averageProtein ? `${Math.round(report.averageProtein)}ג'` : "אין"}
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
                            <span className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm">אין</span>
                          )}
                        </td>
                        <td className="p-2 sm:p-4 text-gray-500 dark:text-slate-400 font-medium text-xs sm:text-sm">{formatDate(report.lastWorkout)}</td>
                        <td className="p-2 sm:p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportTraineeReport(report)}
                            className="border-2 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all active:scale-95 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                            <span className="hidden sm:inline">ייצא דוח</span>
                            <span className="sm:hidden">ייצא</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportTraineeReportToGoogleDrive(report)}
                            disabled={uploadingToDrive}
                            className="text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploadingToDrive ? (
                              <>
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 animate-spin" />
                                <span className="hidden sm:inline">מעלה...</span>
                                <span className="sm:hidden">מעלה</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                                <span className="hidden sm:inline">ייצא ל-Google Drive</span>
                                <span className="sm:hidden">Drive</span>
                              </>
                            )}
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
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ReportsContent />
    </ProtectedRoute>
  );
}

