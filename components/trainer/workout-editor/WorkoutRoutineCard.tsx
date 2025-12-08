"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Plus, GripVertical, Trash2 } from "lucide-react";
import { RoutineExerciseItem } from "./RoutineExerciseItem";
import type { RoutineWithExercises, RoutineExercise } from "@/lib/types";

interface WorkoutRoutineCardProps {
  routine: RoutineWithExercises;
  isExpanded: boolean;
  onToggle: () => void;
  onAddExercise: () => void;
  onUpdateExercise: (exerciseId: string, data: any) => Promise<void>;
  onDeleteExercise: (exerciseId: string) => Promise<void>;
  onDeleteRoutine?: () => void;
  onUpdateExerciseImage?: (exerciseId: string, imageUrl: string) => Promise<void>;
}

export function WorkoutRoutineCard({
  routine,
  isExpanded,
  onToggle,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  onDeleteRoutine,
  onUpdateExerciseImage,
}: WorkoutRoutineCardProps) {
  const sortedExercises = [...routine.routine_exercises].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <Card className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-md rounded-xl sm:rounded-2xl">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all rounded-t-xl sm:rounded-t-2xl"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl">
              <GripVertical className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-gray-900 dark:text-white text-xl font-black">
              רוטינה {routine.letter}: {routine.name}
            </CardTitle>
            {sortedExercises.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-blue-700 dark:text-blue-400 font-black text-sm">{sortedExercises.length}</span>
                <span className="text-gray-500 dark:text-slate-400 text-xs mr-1">תרגילים</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onDeleteRoutine && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRoutine();
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-3 sm:space-y-4 pt-4">
          {sortedExercises.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl inline-block">
                <Plus className="h-12 w-12 text-gray-500 dark:text-slate-400 mx-auto" />
              </div>
              <p className="text-gray-500 dark:text-slate-400 font-medium">אין תרגילים ברוטינה זו</p>
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
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-black rounded-xl shadow-sm transition-all active:scale-98"
          >
            <Plus className="h-5 w-5 ml-2" />
            הוסף תרגיל לרוטינה
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

