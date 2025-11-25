"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Plus, GripVertical } from "lucide-react";
import { RoutineExerciseItem } from "./RoutineExerciseItem";
import type { RoutineWithExercises, RoutineExercise } from "@/lib/types";

interface WorkoutRoutineCardProps {
  routine: RoutineWithExercises;
  isExpanded: boolean;
  onToggle: () => void;
  onAddExercise: () => void;
  onUpdateExercise: (exerciseId: string, data: any) => Promise<void>;
  onDeleteExercise: (exerciseId: string) => Promise<void>;
  onUpdateExerciseImage?: (exerciseId: string, imageUrl: string) => Promise<void>;
}

export function WorkoutRoutineCard({
  routine,
  isExpanded,
  onToggle,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onUpdateExerciseImage,
}: WorkoutRoutineCardProps) {
  const sortedExercises = [...routine.routine_exercises].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all shadow-lg rounded-2xl">
      <CardHeader
        className="cursor-pointer hover:bg-accent/30 transition-all rounded-t-2xl"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2.5 rounded-xl">
              <GripVertical className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-foreground text-xl font-black">
              רוטינה {routine.letter}: {routine.name}
            </CardTitle>
            {sortedExercises.length > 0 && (
              <div className="bg-primary/10 px-3 py-1 rounded-lg border border-primary/30">
                <span className="text-primary font-black text-sm">{sortedExercises.length}</span>
                <span className="text-muted-foreground text-xs mr-1">תרגילים</span>
              </div>
            )}
          </div>
          <div className="bg-background p-2 rounded-xl border border-border">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-primary" />
            ) : (
              <ChevronDown className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3 pt-4">
          {sortedExercises.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="bg-accent/30 p-6 rounded-2xl inline-block">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto" />
              </div>
              <p className="text-muted-foreground font-medium">אין תרגילים ברוטינה זו</p>
            </div>
          ) : (
            sortedExercises.map((re, index) => (
              <RoutineExerciseItem
                key={re.id}
                exercise={re as RoutineExercise & { exercise?: { id: string; name: string; image_url: string | null } }}
                index={index}
                onUpdate={onUpdateExercise}
                onDelete={onDeleteExercise}
                onUpdateImage={onUpdateExerciseImage}
              />
            ))
          )}
          <Button
            onClick={onAddExercise}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-98"
          >
            <Plus className="h-5 w-5 ml-2" />
            הוסף תרגיל לרוטינה
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

