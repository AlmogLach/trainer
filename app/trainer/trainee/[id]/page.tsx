"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scale, Edit, Eye, TrendingUp, Loader2, Mail, Phone, Calendar, ChevronDown, ChevronUp, Dumbbell, AlertCircle } from "lucide-react";
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

function TraineeManagementPageContent() {
  const params = useParams();
  const traineeId = params.id as string;
  const { user } = useAuth();

  // State for real data from Supabase
  const [trainee, setTrainee] = useState<User | null>(null);
  const [weeklyWeights, setWeeklyWeights] = useState<Array<{ date: string; weight: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogWithDetails[]>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

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

  // Ensure user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
          </div>
          <p className="text-xl font-black text-foreground animate-pulse">טוען...</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary relative z-10" />
          </div>
          <div>
            <p className="text-xl font-black text-foreground animate-pulse">טוען נתונים...</p>
            <p className="text-sm text-muted-foreground mt-1">מכין את פרופיל המתאמן</p>
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

  // Show error state
  if (error || !trainee) {
    return (
      <div className="min-h-screen bg-background p-6" dir="rtl">
        <div className="max-w-6xl mx-auto pt-8">
          <Card className="bg-card border-2 border-red-500/30 shadow-lg rounded-[2rem]">
            <CardContent className="pt-6 text-center space-y-6">
              <div className="bg-red-500/10 p-6 rounded-3xl inline-block">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-red-500 font-black text-xl">{error || "לא נמצא מתאמן"}</p>
                <p className="text-muted-foreground">המתאמן שחיפשת לא נמצא במערכת</p>
              </div>
              <Link href="/trainer/trainees">
                <Button className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95">
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
    <div className="min-h-screen bg-background p-5 lg:p-6 pb-24 lg:pb-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-card via-card to-accent/10 rounded-[2rem] p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="relative z-10 flex items-center gap-4">
            <Link href="/trainer/trainees">
              <div className="bg-background p-2.5 rounded-2xl shadow-md border border-border hover:bg-accent/50 transition-all active:scale-95">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <div className="flex-1">
              <p className="text-primary font-bold text-sm uppercase tracking-wider mb-1">FitLog Trainer 👤</p>
              <h2 className="text-4xl font-black text-foreground">פרופיל מתאמן</h2>
              <p className="text-muted-foreground text-sm mt-1">{trainee.name}</p>
            </div>
          </div>
        </div>

        {/* Trainee Profile Section */}
        <Card className="bg-card border-border shadow-lg rounded-[2rem]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2.5 rounded-2xl">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black text-foreground">מידע אישי</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Enhanced Profile Picture */}
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary font-black text-4xl flex-shrink-0 border-4 border-primary/30 shadow-lg">
                {trainee.name.charAt(0)}
              </div>
              
              {/* Profile Details */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-accent/30 rounded-xl p-3 border border-border/50">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{trainee.email || "אין אימייל"}</span>
                </div>
                <div className="flex items-center gap-3 bg-accent/30 rounded-xl p-3 border border-border/50">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Phone className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">אין טלפון</span>
                </div>
                <div className="flex items-center gap-3 bg-accent/30 rounded-xl p-3 border border-border/50">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium text-foreground">הצטרף: {formatDate(trainee.created_at)}</span>
                </div>
                <div className="flex items-center gap-3 bg-accent/30 rounded-xl p-3 border border-border/50">
                  <div className="bg-orange-500/20 p-2 rounded-lg">
                    <Dumbbell className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-bold text-foreground">
                      {workoutPlan?.name || "אין תוכנית"}
                    </span>
                    {workoutPlan && (
                      <Link href={`/trainer/workout-plans/${traineeId}/edit`}>
                        <Button className="bg-primary/20 text-primary hover:bg-primary/30 font-bold text-xs h-7 px-3 rounded-lg border-0 transition-all active:scale-95">
                          <Eye className="h-3 w-3 ml-1" />
                          צפה
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Biometric Data Section */}
        <Card className="bg-card border-border shadow-lg rounded-[2rem]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2.5 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-2xl font-black text-foreground">נתונים ביומטריים</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                התקדמות משקל גוף
              </h3>
              <div className="bg-accent/20 rounded-2xl p-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Workouts Section */}
        <Card className="bg-card border-border shadow-lg rounded-[2rem]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2.5 rounded-2xl">
                  <Dumbbell className="h-6 w-6 text-orange-500" />
                </div>
                <CardTitle className="text-2xl font-black text-foreground">אימונים אחרונים</CardTitle>
              </div>
              {workoutLogs.length > 0 && (
                <div className="bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/30">
                  <span className="text-orange-500 font-black text-lg">{workoutLogs.length}</span>
                  <span className="text-muted-foreground text-sm mr-1">אימונים</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workoutLogs.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="bg-accent/30 p-8 rounded-3xl inline-block">
                    <Dumbbell className="h-16 w-16 text-muted-foreground mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-foreground font-black text-xl">אין אימונים עדיין</p>
                    <p className="text-muted-foreground">המתאמן עדיין לא ביצע אימונים</p>
                  </div>
                </div>
              ) : (
                workoutLogs.slice(0, 10).map((workout, index) => {
                  const isExpanded = expandedWorkouts.has(workout.id);
                  const groupedSets = workout.set_logs ? groupSetsByExercise(workout.set_logs) : {};
                  
                  return (
                    <div 
                      key={workout.id} 
                      className="border-2 border-border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Enhanced Workout Header */}
                      <div 
                        className="bg-gradient-to-r from-accent/30 to-accent/20 hover:from-accent/40 hover:to-accent/30 transition-all cursor-pointer"
                        onClick={() => toggleWorkoutExpansion(workout.id)}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="bg-background p-2 rounded-xl border border-border">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-primary" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-foreground font-black text-lg">
                                  {workout.routine ? `אימון ${workout.routine.letter}${workout.routine.name ? ` - ${workout.routine.name}` : ''}` : 'אימון'}
                                </span>
                                <span className="text-sm text-muted-foreground font-medium">
                                  {formatWorkoutDate(workout.date)}
                                </span>
                              </div>
                              {workout.set_logs && workout.set_logs.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1 font-medium">
                                  {workout.set_logs.length} סטים • {Object.keys(groupedSets).length} תרגילים
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/30">
                              <span className="text-green-500 font-black text-sm">
                                {getWorkoutCompletion(workout)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Expanded Workout Details */}
                      {isExpanded && workout.set_logs && workout.set_logs.length > 0 && (
                        <div className="bg-card p-5 space-y-4">
                          {Object.entries(groupedSets).map(([exerciseName, sets]) => (
                            <div key={exerciseName} className="border-2 border-primary/20 rounded-2xl p-4 bg-gradient-to-br from-accent/20 to-accent/10">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="bg-primary/20 p-2 rounded-xl">
                                  <Dumbbell className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="text-foreground font-black text-lg">{exerciseName}</h4>
                                <span className="text-xs text-muted-foreground font-bold bg-accent/50 px-2 py-1 rounded-lg">
                                  {sets.length} סטים
                                </span>
                              </div>
                              <div className="space-y-2">
                                {sets.map((setLog, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center justify-between p-3 bg-card rounded-xl border-2 border-border hover:border-primary/30 transition-all"
                                  >
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-muted-foreground font-bold bg-accent/50 px-2 py-1 rounded-lg">
                                        סט {idx + 1}
                                      </span>
                                      <span className="text-foreground font-black">
                                        {setLog.weight_kg > 0 ? `${setLog.weight_kg} ק"ג` : 'משקל גוף'}
                                      </span>
                                      <span className="text-muted-foreground font-bold">×</span>
                                      <span className="text-foreground font-black">{setLog.reps} חזרות</span>
                                      {setLog.rir_actual !== null && (
                                        <>
                                          <span className="text-muted-foreground mx-1">•</span>
                                          <span className="text-muted-foreground font-medium">RIR: {setLog.rir_actual}</span>
                                        </>
                                      )}
                                    </div>
                                    {setLog.notes && (
                                      <span className="text-xs text-muted-foreground max-w-xs truncate font-medium" title={setLog.notes}>
                                        {setLog.notes}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {/* Enhanced Workout Summary */}
                          <div className="mt-4 pt-4 border-t-2 border-border">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-blue-500/10 rounded-2xl p-4 text-center border-2 border-blue-500/20">
                                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">סה"כ סטים</p>
                                <p className="text-2xl font-black text-blue-500">{workout.set_logs.length}</p>
                              </div>
                              <div className="bg-purple-500/10 rounded-2xl p-4 text-center border-2 border-purple-500/20">
                                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">סה"כ תרגילים</p>
                                <p className="text-2xl font-black text-purple-500">{Object.keys(groupedSets).length}</p>
                              </div>
                              <div className="bg-primary/10 rounded-2xl p-4 text-center border-2 border-primary/20">
                                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase">סה"כ נפח</p>
                                <p className="text-2xl font-black text-primary">
                                  {workout.set_logs.reduce((total, set) => 
                                    total + (set.weight_kg * set.reps), 0
                                  ).toFixed(0)} ק"ג
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
