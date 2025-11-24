"use client";

import { useEffect, useState, useRef } from "react";

interface WorkoutBackup {
  sets: Record<string, Array<{
    setNumber: number;
    weight: string;
    reps: string;
    rir: string;
  }>>;
  routineId: string | null;
  timestamp: number;
  exerciseIds?: string[];
}

const STORAGE_KEY = 'current_workout_backup';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEBOUNCE_MS = 500; // Save after 500ms of no changes

export function useWorkoutPersistence(
  exercisesSets: Record<string, Array<{
    setNumber: number;
    weight: string;
    reps: string;
    rir: string;
  }>>,
  selectedRoutineId: string | null,
  exerciseIds: string[] = []
) {
  const [hasRestored, setHasRestored] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Save to localStorage with debouncing to avoid excessive writes
  useEffect(() => {
    if (Object.keys(exercisesSets).length > 0 && selectedRoutineId) {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Create a serialized version to check if data actually changed
      const serialized = JSON.stringify({ sets: exercisesSets, routineId: selectedRoutineId, exerciseIds });
      if (serialized === lastSavedRef.current) {
        return; // No changes, skip save
      }

      // Set new timer for debounced save
      debounceTimerRef.current = setTimeout(() => {
        const backup: WorkoutBackup = {
          sets: exercisesSets,
          routineId: selectedRoutineId,
          timestamp: Date.now(),
          exerciseIds,
        };
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
          lastSavedRef.current = serialized;
        } catch (error) {
          console.error('Failed to save workout backup:', error);
        }
      }, DEBOUNCE_MS);
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [exercisesSets, selectedRoutineId, exerciseIds]);

  // Load from localStorage on mount
  const loadBackup = (): WorkoutBackup | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const backup: WorkoutBackup = JSON.parse(saved);
      
      // Check if backup is too old
      const age = Date.now() - backup.timestamp;
      if (age > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return backup;
    } catch (error) {
      console.error('Failed to load workout backup:', error);
      return null;
    }
  };

  // Clear backup
  const clearBackup = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear workout backup:', error);
    }
  };

  return {
    loadBackup,
    clearBackup,
    hasRestored,
    setHasRestored,
  };
}

