"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Loader2, Plus, X, CheckCircle2, Calendar, TrendingUp,
  Home, BarChart3, Users, Target, Settings, Image as ImageIcon, Apple, Dumbbell
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkoutLogs, getBodyWeightHistory, saveBodyWeight } from "@/lib/db";
import type { WorkoutLogWithDetails } from "@/lib/types";
import { SimpleLineChart } from "@/components/ui/SimpleLineChart";
import { isBenchPressExercise } from "@/lib/constants";

// Calculate 1RM using Brzycki formula
function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight / (1.0278 - 0.0278 * reps);
}

function ProgressTrackingContent() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [weightHistory, setWeightHistory] = useState<Array<{ date: string; weight: number }>>([]);
  const [benchPressHistory, setBenchPressHistory] = useState<Array<{ date: string; oneRM: number }>>([]);
  const [timeFilter, setTimeFilter] = useState<"month" | "3months" | "6months" | "year">("month");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [bodyWeight, setBodyWeight] = useState("");
  const [weightError, setWeightError] = useState<string | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<Array<{ id: string; date: string; url: string }>>([]);

  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user?.id]);

  const loadProgressData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Load data in parallel for better performance
      const [weights, logs] = await Promise.all([
        getBodyWeightHistory(user.id),
        getWorkoutLogs(user.id)
      ]);
      
      setWeightHistory(weights);
      
      // Find bench press exercises (search for variations)
      const benchPressData: Array<{ date: string; oneRM: number }> = [];
      
      logs.forEach(log => {
        log.set_logs?.forEach(setLog => {
          const exerciseName = setLog.exercise?.name;
          const muscleGroup = setLog.exercise?.muscle_group;
          
          if (isBenchPressExercise(exerciseName, muscleGroup) && setLog.weight_kg && setLog.reps) {
            const oneRM = calculate1RM(setLog.weight_kg, setLog.reps);
            benchPressData.push({
              date: log.date,
              oneRM: oneRM
            });
          }
        });
      });

      // Group by date and take max 1RM for each date
      const groupedByDate = new Map<string, number>();
      benchPressData.forEach(item => {
        const existing = groupedByDate.get(item.date);
        if (!existing || item.oneRM > existing) {
          groupedByDate.set(item.date, item.oneRM);
        }
      });

      const sortedBenchPress = Array.from(groupedByDate.entries())
        .map(([date, oneRM]) => ({ date, oneRM }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setBenchPressHistory(sortedBenchPress);

      // TODO: Load progress photos from storage
      // For now, using mock data
      setProgressPhotos([]);

    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSubmit = async () => {
    if (!user?.id || !bodyWeight) return;

    setWeightError(null);
    setSavingWeight(true);

    try {
      const weight = parseFloat(bodyWeight);
      if (isNaN(weight) || weight <= 0) {
        setWeightError('אנא הזן משקל תקין (מספר חיובי)');
        setSavingWeight(false);
        return;
      }

      if (weight > 500) {
        setWeightError('המשקל שהוזן לא סביר. אנא בדוק את הערך.');
        setSavingWeight(false);
        return;
      }

      await saveBodyWeight(user.id, weight);
      
      setShowWeightInput(false);
      setBodyWeight("");
      setWeightError(null);
      await loadProgressData();
    } catch (error: any) {
      console.error('Error saving weight:', error);
      setWeightError(error.message || 'שגיאה בשמירת המשקל');
    } finally {
      setSavingWeight(false);
    }
  };

  // Filter data based on time filter
  const getFilteredWeightData = () => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeFilter) {
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return weightHistory
      .filter(item => new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getFilteredBenchPressData = () => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeFilter) {
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return benchPressHistory
      .filter(item => new Date(item.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };


  const filteredWeightData = getFilteredWeightData();
  const filteredBenchPressData = getFilteredBenchPressData();
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;
  const currentBenchPress = benchPressHistory.length > 0 
    ? benchPressHistory[benchPressHistory.length - 1].oneRM 
    : null;

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "month": return "חודש אחרון";
      case "3months": return "3 חודשים";
      case "6months": return "6 חודשים";
      case "year": return "שנה";
      default: return "חודש אחרון";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">טוען נתוני התקדמות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      {/* Enhanced Header with FitLog Style */}
      <div className="bg-gradient-to-br from-card via-card to-accent/10 px-6 pt-6 pb-6 rounded-b-[2.5rem] shadow-lg mb-6 relative overflow-hidden sticky top-0 z-10">
        {/* Animated Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/30 rounded-full blur-2xl -z-10 -translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-2xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-2xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">מעקב התקדמות</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Progress Tracking</p>
            </div>
          </div>
          
          <Link href="/trainee/dashboard">
            <div className="bg-background p-2.5 rounded-2xl shadow-md border border-border hover:bg-accent/50 transition-all active:scale-95">
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-5 space-y-6">
        {/* Body Weight Section */}
        <Card className="bg-card border-border shadow-md rounded-[2rem] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-xl">
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
                <CardTitle className="text-xl font-black text-foreground">משקל גוף</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                {currentWeight && (
                  <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/30">
                    <span className="text-2xl font-black text-primary">
                      {currentWeight.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground mr-1">kg</span>
                  </div>
                )}
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="bg-background border-2 border-border text-foreground text-sm rounded-xl px-3 py-2 font-bold focus:border-primary outline-none transition-all"
                >
                  <option value="month">חודש אחרון</option>
                  <option value="3months">3 חודשים</option>
                  <option value="6months">6 חודשים</option>
                  <option value="year">שנה</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-accent/20 rounded-2xl p-4 mb-4">
              <SimpleLineChart
                data={filteredWeightData.map(item => ({ date: item.date, value: item.weight }))}
                currentValue={currentWeight}
                unit="kg"
              />
            </div>
            <Button
              onClick={() => setShowWeightInput(true)}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="h-5 w-5 ml-2" />
              הוסף שקילה
            </Button>
          </CardContent>
        </Card>

        {/* Bench Press 1RM Section */}
        <Card className="bg-card border-border shadow-md rounded-[2rem] animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-xl">
                  <Dumbbell className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-foreground">כוח - לחיצת חזה</CardTitle>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">One Rep Max (1RM)</p>
                </div>
              </div>
              {currentBenchPress && (
                <div className="bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/30">
                  <span className="text-2xl font-black text-orange-500">
                    {currentBenchPress.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground mr-1">kg</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-accent/20 rounded-2xl p-4 mb-4">
              <SimpleLineChart
                data={filteredBenchPressData.map(item => ({ date: item.date, value: item.oneRM }))}
                currentValue={currentBenchPress}
                unit="kg"
              />
            </div>
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-border text-foreground hover:bg-accent/50 font-bold rounded-2xl transition-all active:scale-95"
            >
              <BarChart3 className="h-5 w-5 ml-2" />
              היסטוריית ביצועים
            </Button>
          </CardContent>
        </Card>

        {/* Progress Photos Section */}
        <Card className="bg-card border-border shadow-md rounded-[2rem] animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-xl">
                <ImageIcon className="w-5 h-5 text-purple-500" />
              </div>
              <CardTitle className="text-xl font-black text-foreground">תמונות התקדמות</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {progressPhotos.length === 0 ? (
                <>
                  <div className="flex-1 aspect-[3/4] bg-accent/20 border-2 border-border rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <span className="text-xs text-muted-foreground font-medium">אין תמונות</span>
                    </div>
                  </div>
                  <div className="flex-1 aspect-[3/4] bg-accent/20 border-2 border-border rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <span className="text-xs text-muted-foreground font-medium">אין תמונות</span>
                    </div>
                  </div>
                  <div className="flex-1 aspect-[3/4] bg-accent/10 border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all active:scale-95">
                    <Plus className="h-8 w-8 text-primary mb-2" />
                    <span className="text-xs text-primary font-bold">הוסף תמונה</span>
                  </div>
                </>
              ) : (
                <>
                  {progressPhotos.slice(0, 2).map((photo) => (
                    <div key={photo.id} className="flex-1 aspect-[3/4] bg-accent/20 border-2 border-border rounded-2xl overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-accent/50 to-accent/20 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="p-2 text-xs text-muted-foreground font-medium text-center">
                        {new Date(photo.date).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  ))}
                  <div className="flex-1 aspect-[3/4] bg-accent/10 border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all active:scale-95">
                    <Plus className="h-8 w-8 text-primary mb-2" />
                    <span className="text-xs text-primary font-bold">הוסף תמונה</span>
                  </div>
                </>
              )}
            </div>
            <Button
              className="w-full h-12 mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-500/20 transition-all active:scale-95"
            >
              <Plus className="h-5 w-5 ml-2" />
              הוסף תמונה
            </Button>
          </CardContent>
        </Card>

        {/* Weight Input Modal */}
        {showWeightInput && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="bg-card border-border shadow-2xl w-full max-w-sm rounded-[2rem] animate-in zoom-in-95 slide-in-from-top-4 duration-300">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-foreground font-black text-xl">הוסף שקילה</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowWeightInput(false);
                      setBodyWeight("");
                      setWeightError(null);
                    }}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                {weightError && (
                  <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    {weightError}
                  </div>
                )}
                <div className="bg-accent/30 rounded-2xl p-6 border-2 border-border/50">
                  <Input
                    type="number"
                    step="0.1"
                    value={bodyWeight}
                    onChange={(e) => {
                      setBodyWeight(e.target.value);
                      setWeightError(null);
                    }}
                    placeholder="0.0"
                    className="w-full px-4 py-6 text-4xl font-black bg-background border-2 border-transparent focus:border-primary text-foreground text-center rounded-2xl"
                    autoFocus
                    disabled={savingWeight}
                  />
                  <p className="text-center text-muted-foreground text-sm font-medium mt-3">קילוגרם (kg)</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleWeightSubmit}
                    className="flex-1 h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                    disabled={!bodyWeight || savingWeight}
                  >
                    {savingWeight ? (
                      <>
                        <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 ml-2" />
                        שמור
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWeightInput(false);
                      setBodyWeight("");
                      setWeightError(null);
                    }}
                    className="flex-1 h-14 border-2 border-border text-foreground hover:bg-accent/50 font-bold rounded-2xl transition-all active:scale-95"
                    disabled={savingWeight}
                  >
                    ביטול
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

    </div>
  );
}

export default function ProgressTrackingPage() {
  return <ProgressTrackingContent />;
}
