// ============================================
// LEGACY EXPORT FILE - Re-exports from domain modules
// ============================================
// This file maintains backward compatibility while the codebase is refactored
// All new code should import directly from lib/api/* modules
// ============================================

// Re-export error handling
export { DatabaseError, handleDatabaseError } from './api/errors';

// Re-export user functions
export {
  getTrainerTrainees,
  getTrainerTraineesWithDetails,
  createTrainee,
  getUser,
  type TraineeWithDetails,
} from './api/users';

// Re-export workout functions
export {
  getExerciseLibrary,
  getExercise,
  getExerciseByName,
  createExercise,
  updateExercise,
  getActiveWorkoutPlan,
  createWorkoutPlan,
  updateWorkoutPlan,
  getRoutinesWithExercises,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  createRoutineExercise,
  updateRoutineExercise,
  deleteRoutineExercise,
  getWorkoutLogs,
  getWorkoutLogsForUsers,
  getWorkoutLog,
  createWorkoutLog,
  updateWorkoutLog,
  createSetLog,
  getBodyWeightHistory,
  getBodyWeightHistoryForUsers,
  saveBodyWeight,
  getTrainerStats,
  getTraineesWithStatus,
  type TrainerStats,
  type TraineeWithStatus,
} from './api/workouts';

// Re-export nutrition functions
export {
  getNutritionMenu,
  updateNutritionMenu,
  getDailyNutritionLog,
  getDailyNutritionLogsForUsers,
  upsertDailyNutritionLog,
  addToDailyNutritionLog,
  getNutritionSwaps,
  getFoodHistory,
  type FoodHistoryItem,
} from './api/nutrition';

// Re-export types
export type {
  User,
  Exercise,
  WorkoutPlan,
  Routine,
  RoutineExercise,
  WorkoutLog,
  SetLog,
  CreateUser,
  CreateExercise,
  CreateWorkoutPlan,
  CreateRoutine,
  CreateRoutineExercise,
  CreateWorkoutLog,
  CreateSetLog,
  WorkoutLogWithDetails,
  RoutineWithExercises,
  NutritionMenu,
  DailyNutritionLog,
} from './types';
