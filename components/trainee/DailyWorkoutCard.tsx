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
    <Card className="bg-gradient-to-br from-card via-card to-accent/10 border-2 border-border rounded-2xl sm:rounded-[2rem] shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-foreground text-lg sm:text-xl font-black">האימון של היום:</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {workoutPlan && currentRoutine ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-black text-foreground">{workoutPlan.name} {currentRoutine.letter}</p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{currentRoutine.name || `אימון ${currentRoutine.letter}`}</p>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-base sm:text-lg font-black">08:30</span>
              </div>
            </div>
            <Link href="/trainee/workout" className="block">
              <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-background font-black h-14 sm:h-16 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-98">
                התחל אימון
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">אין תוכנית אימונים פעילה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

