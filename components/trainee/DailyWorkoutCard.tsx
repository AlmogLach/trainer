"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { WorkoutPlan, RoutineWithExercises } from "@/lib/types";

interface DailyWorkoutCardProps {
  workoutPlan: WorkoutPlan | null;
  currentRoutine: RoutineWithExercises | null;
}

export function DailyWorkoutCard({ workoutPlan, currentRoutine }: DailyWorkoutCardProps) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
      <CardHeader className="p-5">
        <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl font-bold">האימון של היום:</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        {workoutPlan && currentRoutine ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{workoutPlan.name} {currentRoutine.letter}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">{currentRoutine.name || `אימון ${currentRoutine.letter}`}</p>
              </div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-base sm:text-lg font-black">08:30</span>
              </div>
            </div>
            <Link href="/trainee/workout" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold h-14 sm:h-16 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-sm transition-all active:scale-98">
                התחל אימון
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-slate-400">אין תוכנית אימונים פעילה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

