"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, TrendingUp, Apple, User } from "lucide-react";

export default function TraineeDashboard() {
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [showWeightInput, setShowWeightInput] = useState(false);

  // Mock data - will be replaced with real data from Supabase
  const todayWorkout = { letter: "A", name: "רגליים" };
  const nutritionProgress = { protein: 85, proteinTarget: 180, calories: 1450, caloriesTarget: 2800 };
  const currentWeight = 82.5;

  const handleWeightSubmit = () => {
    // TODO: Save to Supabase
    console.log("Saving weight:", bodyWeight);
    setShowWeightInput(false);
    setBodyWeight("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <h1 className="text-3xl font-bold text-gray-900">היום שלי</h1>
          <Button variant="ghost" size="icon">
            <User className="h-6 w-6" />
          </Button>
        </div>

        {/* Today's Workout Card */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6" />
              <CardTitle className="text-white">האימון של היום</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="text-6xl font-bold mb-2">{todayWorkout.letter}</div>
              <div className="text-2xl">{todayWorkout.name}</div>
            </div>
            <Link href="/trainee/workout">
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold" size="lg">
                התחל אימון
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Body Weight Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <CardTitle className="text-xl">משקל גוף</CardTitle>
              </div>
              {!showWeightInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWeightInput(true)}
                >
                  עדכן
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!showWeightInput ? (
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-gray-900">{currentWeight} ק"ג</div>
                <CardDescription className="mt-2">נמדד הבוקר</CardDescription>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="number"
                  step="0.1"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder="הזן משקל (ק״ג)"
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleWeightSubmit}
                    className="flex-1"
                    disabled={!bodyWeight}
                  >
                    שמור
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWeightInput(false);
                      setBodyWeight("");
                    }}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutrition Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-xl">תזונה היום</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Protein Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">חלבון</span>
                <span className="text-sm font-medium text-gray-900">
                  {nutritionProgress.protein} / {nutritionProgress.proteinTarget} גרם
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((nutritionProgress.protein / nutritionProgress.proteinTarget) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Calories Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">קלוריות</span>
                <span className="text-sm font-medium text-gray-900">
                  {nutritionProgress.calories} / {nutritionProgress.caloriesTarget}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((nutritionProgress.calories / nutritionProgress.caloriesTarget) * 100, 100)}%` }}
                />
              </div>
            </div>

            <Link href="/trainee/nutrition">
              <Button variant="outline" className="w-full">
                מחשבון המרות תזונה
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              צפה בהיסטוריית אימונים
            </Button>
            <Button variant="outline" className="w-full justify-start">
              גרפי התקדמות
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
