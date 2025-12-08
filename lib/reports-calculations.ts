// Calculations for reports - PRs, Nutrition, Trends

import type { WorkoutLogWithDetails, DailyNutritionLog } from './types';

export interface PRData {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  oneRM: number;
}

export interface NutritionStats {
  averageCalories: number | null;
  averageProtein: number | null;
  averageCarbs: number | null;
  averageFat: number | null;
  nutritionCompliance: number;
}

/**
 * Calculate 1RM from weight and reps using Epley formula
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Calculate PRs from workout logs
 */
export function calculatePRs(
  logs: WorkoutLogWithDetails[],
  timeFilter: 'week' | 'month' | 'all' = 'all'
): {
  prsThisWeek: number;
  prsThisMonth: number;
  prsAllTime: number;
  prsList: PRData[];
} {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter logs by time period
  let filteredLogs = logs.filter(log => log.completed);
  if (timeFilter === 'week') {
    filteredLogs = filteredLogs.filter(log => new Date(log.date) >= weekAgo);
  } else if (timeFilter === 'month') {
    filteredLogs = filteredLogs.filter(log => new Date(log.date) >= monthAgo);
  }

  // Track best performance per exercise
  const exercisePRs = new Map<string, {
    weight: number;
    reps: number;
    date: string;
    oneRM: number;
    exerciseName: string;
  }>();

  // Track PRs by time period
  const weekPRs = new Set<string>();
  const monthPRs = new Set<string>();
  const allTimePRs = new Set<string>();

  filteredLogs.forEach(log => {
    const logDate = new Date(log.date);
    const isThisWeek = logDate >= weekAgo;
    const isThisMonth = logDate >= monthAgo;

    log.set_logs?.forEach(setLog => {
      if (!setLog.weight_kg || !setLog.reps || !setLog.exercise) return;

      const exerciseId = setLog.exercise_id || setLog.exercise.id;
      const exerciseName = setLog.exercise.name;
      const weight = setLog.weight_kg;
      const reps = setLog.reps;
      const oneRM = calculate1RM(weight, reps);

      const existingPR = exercisePRs.get(exerciseId);
      const prKey = `${exerciseId}-${weight}-${reps}`;

      if (!existingPR || oneRM > existingPR.oneRM) {
        // New PR!
        exercisePRs.set(exerciseId, {
          weight,
          reps,
          date: log.date,
          oneRM,
          exerciseName,
        });

        if (isThisWeek) {
          weekPRs.add(exerciseId);
        }
        if (isThisMonth) {
          monthPRs.add(exerciseId);
        }
        allTimePRs.add(exerciseId);
      }
    });
  });

  // Convert to list
  const prsList: PRData[] = Array.from(exercisePRs.values()).map(pr => ({
    exerciseId: pr.exerciseName, // Using name as ID for simplicity
    exerciseName: pr.exerciseName,
    weight: pr.weight,
    reps: pr.reps,
    date: pr.date,
    oneRM: pr.oneRM,
  }));

  return {
    prsThisWeek: weekPRs.size,
    prsThisMonth: monthPRs.size,
    prsAllTime: allTimePRs.size,
    prsList,
  };
}

/**
 * Calculate nutrition statistics from daily logs
 */
export function calculateNutritionStats(
  logs: DailyNutritionLog[],
  timeFilter: 'week' | 'month' | 'all' = 'all',
  targetCalories?: number,
  targetProtein?: number
): NutritionStats {
  if (logs.length === 0) {
    return {
      averageCalories: null,
      averageProtein: null,
      averageCarbs: null,
      averageFat: null,
      nutritionCompliance: 0,
    };
  }

  // Filter by time period
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let filteredLogs = logs;
  if (timeFilter === 'week') {
    filteredLogs = logs.filter(log => new Date(log.date) >= weekAgo);
  } else if (timeFilter === 'month') {
    filteredLogs = logs.filter(log => new Date(log.date) >= monthAgo);
  }

  if (filteredLogs.length === 0) {
    return {
      averageCalories: null,
      averageProtein: null,
      averageCarbs: null,
      averageFat: null,
      nutritionCompliance: 0,
    };
  }

  // Calculate averages
  const validLogs = filteredLogs.filter(log => 
    log.total_calories !== null && 
    log.total_protein !== null && 
    log.total_carbs !== null && 
    log.total_fat !== null
  );

  if (validLogs.length === 0) {
    return {
      averageCalories: null,
      averageProtein: null,
      averageCarbs: null,
      averageFat: null,
      nutritionCompliance: 0,
    };
  }

  const totalCalories = validLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  const totalProtein = validLogs.reduce((sum, log) => sum + (log.total_protein || 0), 0);
  const totalCarbs = validLogs.reduce((sum, log) => sum + (log.total_carbs || 0), 0);
  const totalFat = validLogs.reduce((sum, log) => sum + (log.total_fat || 0), 0);

  const averageCalories = totalCalories / validLogs.length;
  const averageProtein = totalProtein / validLogs.length;
  const averageCarbs = totalCarbs / validLogs.length;
  const averageFat = totalFat / validLogs.length;

  // Calculate compliance (how close to targets)
  let nutritionCompliance = 0;
  if (targetCalories && targetProtein) {
    const caloriesDiff = Math.abs(averageCalories - targetCalories) / targetCalories;
    const proteinDiff = Math.abs(averageProtein - targetProtein) / targetProtein;
    const overallDiff = (caloriesDiff + proteinDiff) / 2;
    nutritionCompliance = Math.max(0, Math.min(100, (1 - overallDiff) * 100));
  }

  return {
    averageCalories,
    averageProtein,
    averageCarbs,
    averageFat,
    nutritionCompliance: Math.round(nutritionCompliance),
  };
}

/**
 * Calculate workout trend data for charts
 */
export function calculateWorkoutTrendData(
  logs: WorkoutLogWithDetails[],
  timeFilter: 'week' | 'month' | 'all' = 'all'
): Array<{ date: string; count: number }> {
  const now = new Date();
  let startDate: Date;
  
  if (timeFilter === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeFilter === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(0); // All time
  }

  const filteredLogs = logs.filter(log => 
    log.completed && new Date(log.date) >= startDate
  );

  // Group by date
  const dateMap = new Map<string, number>();
  filteredLogs.forEach(log => {
    const date = log.date.split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  // Convert to array and sort
  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate weight trend data for charts
 */
export function calculateWeightTrendData(
  weightHistory: Array<{ date: string; weight: number }>
): Array<{ date: string; weight: number }> {
  return weightHistory
    .map(w => ({ date: w.date, weight: w.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate nutrition trend data for charts
 */
export function calculateNutritionTrendData(
  logs: DailyNutritionLog[],
  timeFilter: 'week' | 'month' | 'all' = 'all'
): Array<{ date: string; calories: number; protein: number; carbs: number; fat: number }> {
  const now = new Date();
  let startDate: Date;
  
  if (timeFilter === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeFilter === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(0); // All time
  }

  const filteredLogs = logs.filter(log => 
    new Date(log.date) >= startDate &&
    log.total_calories !== null &&
    log.total_protein !== null &&
    log.total_carbs !== null &&
    log.total_fat !== null
  );

  return filteredLogs
    .map(log => ({
      date: log.date,
      calories: log.total_calories || 0,
      protein: log.total_protein || 0,
      carbs: log.total_carbs || 0,
      fat: log.total_fat || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

